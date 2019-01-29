require('dotenv').config();

const mnemonic = process.env.MNEMONIC || '';
if (!mnemonic.length) {
  throw new Error('Mnemonic not set.');
}

const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS || '';
if (!contractAddress.length) {
  throw new Error('Contract address not set.');
}
const providerUrl = process.env.PROVIDER || '';
if (!providerUrl.length) {
  throw new Error('Provider URL not set.');
}

const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const CryptoJS = require('crypto-js');
const express = require('express');
const fs = require('fs');
const bip39 = require('bip39');
const coder = require('web3/lib/solidity/coder');
var hdkey = require('ethereumjs-wallet/hdkey');
const app = express();

const obj = JSON.parse(fs.readFileSync('./build/contracts/DesicoCrowdsale.json', 'utf8'));

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const walletHdpath = 'm/44\'/60\'/0\'/0/';
const addressIndex = 0;
const numAddresses = 1;

var wallets = {};
var addresses = [];

for (let i = addressIndex; i < addressIndex + numAddresses; i++) {
  var wallet = hdwallet.derivePath(walletHdpath + i).getWallet();
  var addr = '0x' + wallet.getAddress().toString('hex');
  
  addresses.push(addr);
  wallets[addr] = wallet;
}

const account = addresses[addressIndex];
const privateKey = wallets[account].getPrivateKey();

if (!process.env.PROVIDER || !process.env.PROVIDER.length) {
  throw new Error('Provider not set.');
}

const provider = new Web3(new Web3.providers.HttpProvider(providerUrl));
const ico = provider.eth.contract(obj.abi).at(contractAddress);
provider.eth.defaultAccount = account; // provider.eth.coinbase;

var _sendRawTransaction = function (functionName, types, args, cb) {
  const fullName = functionName + '(' + types.join() + ')';
  const signature = CryptoJS.SHA3(fullName, { outputLength: 256 }).toString(CryptoJS.enc.Hex).slice(0, 8);
  const dataHex = signature + coder.encodeParams(types, args);
  const data = '0x' + dataHex;

  const nonce = provider.toHex(provider.eth.getTransactionCount(account));
  const gasPrice = provider.toHex(provider.eth.gasPrice);
  const gasLimitHex = provider.toHex(600000);
  const rawTx = {
    nonce: nonce,
    gasPrice: gasPrice,
    gasLimit: gasLimitHex,
    from: account,
    to: contractAddress,
    data: data,
  };

  const tx = new Tx(rawTx);
  tx.sign(privateKey);

  const serializedTx = '0x' + tx.serialize().toString('hex');

  provider.eth.sendRawTransaction(serializedTx, cb);
};

app.post('/whitelist/:address', (req, res) => {
  _sendRawTransaction('addToWhitelist', ['address'], [req.params.address], function (err, txHash) {
    if (err) {
      return res.status(500).send({ 'error': err });
    };

    res.send(txHash);
  });
});

app.delete('/whitelist/:address', (req, res) => {
  _sendRawTransaction('removeFromWhitelist', ['address'], [req.params.address], function (err, txHash) {
    if (err) {
      return res.status(500).send({ 'error': err });
    };

    res.send(txHash);
  });
});

app.get('/whitelist/:address', (req, res) => {
  res.send(ico.whitelist(req.params.address));
});

app.get('/ico/started', (req, res) => {
  res.send(ico.started());
});

app.get('/ico/ended', (req, res) => {
  res.send(ico.ended());
});

app.get('/ico/initialized', (req, res) => {
  res.send(ico.initialized());
});

app.get('/ico/initialize', (req, res) => {
  if (ico.initialized()) {
    return res.status(500).send({ 'error': 'already initialized' });
  }

  _sendRawTransaction('initialize', [], [], function (err, txHash) {
    if (err) {
      return res.status(500).send({ 'error': err });
    };

    res.send(txHash);
  });
});

app.get('/ico/finalized', (req, res) => {
  res.send(ico.isFinalized());
});

app.get('/ico/finalize', (req, res) => {
  if (ico.isFinalized()) {
    return res.status(500).send({ 'error': 'already finalized' });
  }

  _sendRawTransaction('finalize', [], [], function (err, txHash) {
    if (err) {
      return res.status(500).send({ 'error': err });
    };

    res.send(txHash);
  });
});

app.get('/ico/amount/:value', (req, res) => {
  res.send(ico.amount(req.params.value));
});

app.listen(3000, () => console.log('App listening on port 3000'));
