import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button } from '../components/common/Button';
import { WalletService } from '../services/WalletService';
import { SupabaseService, Player } from '../services/SupabaseService';
import * as Clipboard from 'expo-clipboard';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    checkWalletAndPlayer();
  }, []);

  const checkWalletAndPlayer = async () => {
    try {
      const address = await WalletService.getWalletAddress();
      setWalletAddress(address);
      
      if (address) {
        const playerData = await SupabaseService.getPlayerByWallet(address);
        setPlayer(playerData);
      }
    } catch (error) {
      console.error('Error checking wallet and player:', error);
    } finally {
      setInitializing(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      const address = await WalletService.createWallet();
      setWalletAddress(address);
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNickname = async () => {
    if (!nickname.trim() || !walletAddress) return;
    
    try {
      setLoading(true);
      const playerData = await SupabaseService.createPlayer(walletAddress, nickname.trim());
      if (playerData) {
        setPlayer(playerData);
      } else {
        Alert.alert('Error', 'Failed to set nickname. Please try again.');
      }
    } catch (error) {
      console.error('Error setting nickname:', error);
      Alert.alert('Error', 'Failed to set nickname. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      Alert.alert('Success', 'Wallet address copied to clipboard!');
    }
  };

  if (initializing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Warhead</Text>
      {player && (
        <Text style={styles.subtitle}>Welcome back, {player.nickname}!</Text>
      )}
      <Text style={styles.subtitle}>Your strategic missile warfare game</Text>

      {!walletAddress ? (
        <Button
          title="Create Wallet"
          onPress={handleCreateWallet}
          loading={loading}
        />
      ) : (
        <View style={styles.walletContainer}>
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Your Wallet:</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.addressButton}>
              <Text style={styles.address}>{walletAddress}</Text>
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>

          {!player ? (
            <View style={styles.nicknameContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your nickname"
                placeholderTextColor="#666"
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
              />
              <Button
                title="Set Nickname"
                onPress={handleSetNickname}
                loading={loading}
                disabled={!nickname.trim()}
              />
            </View>
          ) : (
            <Button
              title="Go to Dashboard"
              onPress={() => navigation.navigate('Dashboard')}
              style={styles.dashboardButton}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  walletContainer: {
    width: '100%',
    alignItems: 'center',
  },
  addressContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  addressLabel: {
    color: '#888',
    marginBottom: 10,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  address: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  copyText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 10,
  },
  nicknameContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#fff',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  dashboardButton: {
    marginTop: 20,
  },
}); 