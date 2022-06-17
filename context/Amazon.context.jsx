import { useContext, createContext, useState, useEffect } from "react";
import { useMoralis, useMoralisQuery } from "react-moralis";
import { ethers } from "ethers";

import { amazonCoinAddress, amazonAbi } from "../lib/constants";
export const AmazonContext = createContext();

export const AmazonProvider = ({ children }) => {
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [assets, setAssets] = useState([]);
  const [currentAccount, setCurrentAccount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [etherScan, setEtherScan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [ownedAssets, setOwnedAssets] = useState([]);

  const {
    isWeb3Enabled,
    authenticate,
    isAuthenticated,
    enableWeb3,
    Moralis,
    user,
    isWeb3,
  } = useMoralis();

  const {
    data: assetsData,
    error: assetsDataError,
    isLoading: assetsLoading,
  } = useMoralisQuery("Assets");

  const getOwnedAssets = async () => {
    try {
      if (userData[0].attributes.ownedAssets) {
        // currentUser
        setOwnedAssets((prevItems) => [
          ...prevItems,
          userData[0].attributes.ownedAssets,
        ]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleSetUsername = () => {
    if (user) {
      if (nickname) {
        user.set("nickname", nickname);
        user.save();
        setNickname();
      }
    } else {
      console.log("Can't set empty username");
    }
  };

  const getBalance = async () => {
    try {
      if (!isAuthenticated || !currentAccount) return;
      const options = {
        contractAddress: amazonCoinAddress,
        functionName: "balanceOf",
        abi: amazonAbi,
        params: {
          account: currentAccount,
        },
      };

      if (isWeb3Enabled) {
        const response = await Moralis.executeFunction(options);
        console.log(response.toString());
        setBalance(response.toString());
      }
    } catch (error) {
      console.log(error);
    }
  };

  const listenToUpdate = async () => {
    let query = new Moralis.Query("EthTransactions");
    let subscription = await query.subscribe();
    console.log("RUUNING");
    subscription.on("update", async (object) => {
      console.log("New Transactions");
      console.log(object);
      setTransactions([object]);
    });
  };

  const {
    data: userData,
    error: userDateError,
    isLoading: userDataIsLoading,
  } = useMoralisQuery("_User");

  const buyTokens = async () => {
    if (!isAuthenticated) {
      await authenticate();
    }

    const amount = ethers.BigNumber.from(tokenAmount);
    const price = ethers.BigNumber.from("100000000000000");
    const calcPrice = amount.mul(price);

    let options = {
      contractAddress: amazonCoinAddress,
      functionName: "mint",
      abi: amazonAbi,
      msgValue: calcPrice,
      params: {
        amount,
      },
    };

    const transaction = await Moralis.executeFunction(options);
    const reciept = await transaction.wait(4);
    setIsLoading(false);
    console.log(reciept);
    setEtherScan(`https://rinkeby.etherscan.io/tx/${reciept.transactionHash}`);
    console.log(etherScan);
  };

  const getAssets = async () => {
    try {
      await enableWeb3();
      setAssets(assetsData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    (async () => {
      if (isAuthenticated) {
        await listenToUpdate();
        await getBalance();
        const currentUser = await user?.get("nickname");
        setUsername(currentUser);
        const account = await user?.get("ethAddress");
        setCurrentAccount(account);
      }
    })();
  }, [
    username,
    isAuthenticated,
    user,
    currentAccount,
    getBalance,
    listenToUpdate,
  ]);

  useEffect(() => {
    console.log(assets);
  }, [assets]);
  useEffect(() => {
    (async () => {
      if (isWeb3Enabled) {
        await getOwnedAssets();
        await getAssets();
      }
    })();
  }, [isWeb3Enabled, assetsData, assetsLoading]);

  const buyAssets = async (price, asset) => {
    try {
      if (!isAuthenticated) return;

      const options = {
        type: "erc20",
        amount: price,
        receiver: amazonCoinAddress,
        contractAddress: amazonCoinAddress,
      };

      let transactions = await Moralis.transfer(options);

      const reciepts = await transactions.wait();

      let res;

      if (reciepts) {
        res = userData[0].add("ownedAssets", {
          ...asset,
          purchaseDate: Date.now(),
          etherScan: `https://rinkeby.etherscan.io/tx/${reciepts.transactionHash}`,
        });

        await res.save().then(() => {
          alert("Bought the asset!");
        });
        await listenToUpdate();
      }
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <AmazonContext.Provider
      value={{
        username,
        setUsername,
        nickname,
        setNickname,
        isAuthenticated,
        handleSetUsername,
        assets,
        balance,
        buyTokens,
        tokenAmount,
        amountDue,
        setTokenAmount,
        tokenAmount,
        amountDue,
        setAmountDue,
        isLoading,
        setIsLoading,
        setEtherScan,
        etherScan,
        buyAssets,
        transactions,
        ownedAssets,
      }}
    >
      {children}
    </AmazonContext.Provider>
  );
};
