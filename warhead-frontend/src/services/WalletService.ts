import 'react-native-get-random-values';
import '@ethersproject/shims';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVATE_KEY_KEY = 'WARHEAD_PRIVATE_KEY';
const WALLET_ADDRESS_KEY = 'WARHEAD_WALLET_ADDRESS';

export class WalletService {
  static async createWallet(): Promise<string> {
    try {
      // Create a new random wallet using ethers v5
      const randomWallet = ethers.Wallet.createRandom();
      
      // Store the private key and address
      await SecureStore.setItemAsync(PRIVATE_KEY_KEY, randomWallet.privateKey);
      await AsyncStorage.setItem(WALLET_ADDRESS_KEY, randomWallet.address);
      
      return randomWallet.address;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  static async getWalletAddress(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }

  static async getWallet(): Promise<ethers.Wallet | null> {
    try {
      const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
      if (!privateKey) return null;
      return new ethers.Wallet(privateKey);
    } catch (error) {
      console.error('Error getting wallet:', error);
      return null;
    }
  }

  static async hasWallet(): Promise<boolean> {
    const address = await WalletService.getWalletAddress();
    return address !== null;
  }
} 