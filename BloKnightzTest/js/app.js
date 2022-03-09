/*NFT.html 또는 index.HTML 파일을 실행시켜서(VSC에서 제공하는 Open live sever
툴을 이용했습니다.) MINT YOUR NFT를 누르시면 NFT.html로 넘어가게 되어있습니다.
그 후 Buy NFT를 누르시면 메타마스크에 있는 클레이튼이 켜집니다.
저는 여기서 메타마스크가 아니라 카이카스가 켜지는 것을 만들려고 수많은 시도끝에
방법을 찾아내지 못했습니다...ㅠㅠ 바로 켰을때 카이카스가 켜지고 거래가 가능하게끔 도와주시면
정말로 많이 감사하겠습니다,,,(꾸벅) */
function scheduler(action, ms = 1000, runRightNow = true) {
  if (runRightNow) action();
  setInterval(action, ms);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
/*config파일입니다. ERC721, butERC721의 주소가 들어가는 부분입니당
사진 10장을 임의로 넣어두었습니다. 아래 어드레스 또한 Klaytn remix에서 구현했습니다.
abi 파일까지 업데이트 해놨습니당.*/
const config = {
  contracts: {
    ERC721: {
      abi: abi.ERC721,
      //BLOKNIGHTZV1 address
      address: '0x244857622ba11849d917d553B929Ce7fcF74ED22',
    },
    buyERC721: {
      abi: abi.buyERC721,
      //BLOKNIGHTZSALE address
      address: '0x1308c61d60568ff6ae03Bb6e8dBB8e4AD4bea5C4',
    },
  },
  //chain의 관한 정보를 넣는 부분입니다. 편의를 의해 미리 클레이튼
  //테스트넷 바오밥으로 설정을 해두었습니다.
  network: {
    chainName: 'Klaytn',
    chainId: 1001,
    nativeCurrency: {
      name: 'Klaytn',
      symbol: 'KLAY',
      decimals: 18,
    },
    rpcUrls: ['https://api.baobab.klaytn.net:8651'],
    blockExplorerUrls: ['https://baobab.scope.klaytn.com/'],
  },
};
const App = {
  web3Provider: null,
  currentAccount: null,
  connected: false,

  //Web3가 메타마스크와 관련된 함수입니다.

  init: async function () {
    await App.initWeb3();
    await ERC721.init();
    await buyERC721.init();
    
    //NFT홈페이지에 들어가면 ERC721.pageInit함수가 실행됩니다.
    if (pageName === 'NFT') {
      await ERC721.pageInit();
    }
  },
  initWeb3: async function () {
    App.web3Provider = new Web3.providers.HttpProvider(
      config.network.rpcUrls[0],
    ); // 노드와의 연결
    window.web3 = new Web3(App.web3Provider);

   /*메타마스크와 관련된 코드입니다. 이 부분에서 메타마스크와 연결되었는지 확인합니다.
    이 window.ethereum에 대해 많이 검색 한 결과 이 부분에서 자료를 찾았었지만
    해결을 못했습니당,,,ㅠㅠ
    https://forum.klaytn.com/t/kaikas-window/3932 */
    if (window.ethereum) {
      try {
        //await App.switchNetwork();
        await App.connect();
        await App.chnaged();
      } catch (error) {
        if (error.code === 4001) {
          // User rejected request
          Alert('Please reflesh this page (F5)').close(3000);
        }
        console.log(error);
      }
    } else {
      Alert('There is no Metamask. Please install Metamask.').close(5000);
    }
  },
  switchNetwork: async function () {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x' + config.network.chainId.toString(16),
          chainName: config.network.chainName,
          nativeCurrency: config.network.nativeCurrency,
          rpcUrls: config.network.rpcUrls,
          blockExplorerUrls: config.network.blockExplorerUrls,
        },
      ],
    });
  },
  connect: async function () {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    App.currentAccount = accounts[0];
    App.connected = true;
  },
  chnaged: async function () {
    ethereum.on('accountsChanged', async () => {
      await App.connect();
    });
  },
  //웹에서 Account의 주소를 확인하는 함수를 만들었습니다. Mint your nft에서
  //버튼확인이 가능합니다.
  CheckId: async function () {
    document.getElementById("Account").innerHTML = "Your MetaMask Address : " +  await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
  },
};

function Alert(msg) {
  const div = document.createElement('div');
  div.classList.add('alert');
  div.classList.add('alert-warning');
  div.innerText = msg;
  document.getElementsByTagName('main')[0].prepend(div);
  this.close = function (ms) {
    if (ms && ms > 0) {
      setTimeout(() => div.remove(), ms);
    } else {
      div.remove();
    }
  };
  return this;
}


const ERC721 = {
  contract: null,
  baseURI: '',

  init: async function () {
    // do nothing
    this.contract = new web3.eth.Contract(
      config.contracts.ERC721.abi,
      config.contracts.ERC721.address,
    );
  },
  pageInit: async function () {
    this.writeMaxSupply();
    scheduler(this.writeTotalSupply, 1000);

    this.baseURI = await this.getBaseURI();
    if (App.connected) this.showMyNFTs();
  },

  getBaseURI: async function () {
    return await ERC721.contract.methods.getBaseURI().call();
  },
  getMaxSupply: async function () {
    return await ERC721.contract.methods.MAX_SUPPLY().call();
  },
  getTotalSupply: async function () {
    return await ERC721.contract.methods.totalSupply().call();
  },
  getBalanceOf: async function (address) {
    return await ERC721.contract.methods.balanceOf(address).call();
  },
  getOwnerOf: async function (address) {
    return await ERC721.contract.methods.ownerOf(address).call();
  },
  sendToken: async function (tokenID, toAddress) {
    const alert = Alert(`send #${tokenID} to ${toAddress}...`);
    const evmData = ERC721.contract.methods
      .transferFrom(App.currentAccount, toAddress, tokenID)
      .encodeABI();

    const params = [
      {
        from: App.currentAccount,
        to: config.contracts.ERC721.address,
        data: evmData,
        value: '0x0',
      },
    ];
    ethereum
      .request({
        method: 'eth_sendTransaction',
        params,
      })
      .then((result) => {
        alert.close();
        console.log(result);
      })
      .catch((error) => {
        console.error(error);
      });
  },

  //ERC721.baseURI is img.json file
  getMetadata: async function (tokenId) {
    const tokenURI = ERC721.baseURI + tokenId;
    const result = await fetch(tokenURI);
    return await result.json();
  },

  clickTokenTransfer: async function (tokenId) {
    const toAddress = prompt(`send your #${tokenId}, input toAddress`);
    if (!toAddress) Alert('input valid ToAddress').close(2000);
    ERC721.sendToken(tokenId, toAddress);
  },
  makeNFTElement: function (tokenId, imagePath, attribute) {
    const div = document.createElement('div');
    div.classList.add('col');
    div.style = 'width: 20%;';
    {
      // card
      const card = document.createElement('div');
      card.classList.add('card');
      card.classList.add('h-100');
      div.appendChild(card);
      div.onclick = function () {
        ERC721.clickTokenTransfer(tokenId);
      };
      {
        
        // image
        const img = document.createElement('img');
        img.classList.add('card-img-top');
        img.src = imagePath;
        img.alt = '...';
        card.appendChild(img);
      }
      {
        // desc
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        const title = document.createElement('h5');
        title.classList.add('card-title');
        title.innerText = `#${tokenId}`;
        
        cardBody.appendChild(title);
        card.appendChild(cardBody);
      }
    }
    return div;
  },

  appendNFT: async function (tokenId) {
    const metadata = await ERC721.getMetadata(tokenId);
    const nftElement = ERC721.makeNFTElement(
      tokenId,
      metadata.image,
      metadata.attributes,
    );
    document.getElementById('my-nft-list').appendChild(nftElement);

    const tmp = document.querySelector('#my-nft-list span');
    if (tmp) {
      tmp.remove();
    }
  },

  showMyNFTs: async function () {
    const balance = await ERC721.getBalanceOf(App.currentAccount);
    const total = await ERC721.getTotalSupply();

    let ownerCount = 0;
    for (const index of Array.from(Array(Number(total)).keys())) {
      const tokenId = index + 1;
      const owner = await ERC721.getOwnerOf(tokenId);
      if (owner.toLowerCase() == App.currentAccount.toLowerCase()) {
        ownerCount += 1;
        ERC721.appendNFT(tokenId);
        await sleep(1000); // for Pinata GWS req limit
        if (balance <= ownerCount) break;
      }
    }
  },
  writeMaxSupply: async function () {
   document.getElementById('max-supply').innerHTML =
    await ERC721.getMaxSupply();
  },
  writeTotalSupply: async function () {
    document.getElementById('total-supply').innerHTML =
      await ERC721.getTotalSupply();
  },
};

const buyERC721 = {
  contract: null,
  pricePerETH: 0.002, // TMP 
  init: async function () {
    // do nothing
    this.contract = new web3.eth.Contract(
      config.contracts.buyERC721.abi,
      config.contracts.buyERC721.address,
    );
  },

  getIsSale: async function () {
    return await buyERC721.contract.methods.isSale().call();
  },

  mintWithETH: async function () {
    const numberOfTokens = document.getElementById('number-of-tokens').value;
    if (numberOfTokens > 5)
      return Alert('only mint 5 NFT at a time').close(3000);
    const value = new BigNumber(web3.utils.toWei(numberOfTokens, 'ether'))
      .multipliedBy(buyERC721.pricePerETH)
      .toFixed();

    const evmData = buyERC721.contract.methods
      .mintByETH(numberOfTokens)
      .encodeABI();

    buyERC721.sendMint(web3.utils.toHex(value), evmData);
  },

  //sendMint에도 ethereum.request가 있습니다.
  sendMint: async function (value, evmData) {
    const isSale = await buyERC721.getIsSale();

    if (!isSale) {
       Alert('The sale has not started.').close(3000);
       return;
     }

    const params = [
      {
        from: App.currentAccount,
        to: config.contracts.buyERC721.address,
        data: evmData,
        value,
      },
    ];
    ethereum
      .request({
        method: 'eth_sendTransaction',
        params,
      })
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.error(error);
      });
  },
};

App.init();
