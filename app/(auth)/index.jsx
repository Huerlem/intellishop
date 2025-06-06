import React from 'react';
import { View, text } from 'react-native';
import { Redirect } from 'expo-router';

export default function AuthIndex() {
    
    return <Redirect href="/tabs/explore" />;
  }