import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(50000);
  const [displayBalance, setDisplayBalance] = useState(50000);

  // Animate balance changes
  useEffect(() => {
    if (displayBalance !== balance) {
      const diff = balance - displayBalance;
      const step = diff > 0 ? 100 : -100; // Speed of animation
      
      const timer = setTimeout(() => {
        if (Math.abs(diff) < Math.abs(step)) {
          setDisplayBalance(balance);
        } else {
          setDisplayBalance(prev => prev + step);
        }
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [balance, displayBalance]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.wallet_balance) {
      setBalance(parseFloat(user.wallet_balance));
      setDisplayBalance(parseFloat(user.wallet_balance));
    }
  }, []);

  const deductBalance = (amount) => {
    if (balance >= amount) {
      setBalance(prev => prev - amount);
      return true;
    }
    return false;
  };

  const updateBalance = (newBalance) => {
    setBalance(parseFloat(newBalance));
    // Update local storage too to keep it in sync
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      user.wallet_balance = newBalance;
      localStorage.setItem('user', JSON.stringify(user));
    }
  };

  return (
    <WalletContext.Provider value={{ balance, displayBalance, deductBalance, updateBalance }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
