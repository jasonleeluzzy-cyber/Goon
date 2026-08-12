import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { storeGet } from './lib/storage';

import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import UsernameSetupScreen from './screens/UsernameSetupScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ChatsScreen from './screens/ChatsScreen';
import GroupsScreen from './screens/GroupsScreen';
import ChillOutScreen from './screens/ChillOutScreen';
import AIScreen from './screens/AIScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
import NewChatScreen from './screens/NewChatScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import GroupInfoScreen from './screens/GroupInfoScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import BlockedScreen from './screens/BlockedScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import LegalScreen from './screens/LegalScreen';
import ReportScreen from './screens/ReportScreen';
import ModerationScreen from './screens/ModerationScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { palette: t } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.tab,
          borderTopColor: t.line,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: t.accent2,
        tabBarInactiveTintColor: t.faint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Chats: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Groups: focused ? 'people' : 'people-outline',
            Chill: focused ? 'planet' : 'planet-outline',
            Gooni: focused ? 'sparkles' : 'sparkles-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };
          return <Ionicons name={map[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Chill" component={ChillOutScreen} options={{ title: 'Chill Out' }} />
      <Tab.Screen name="Gooni" component={AIScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthFlow() {
  return <UsernameSetupScreen />;
}

function RootNav() {
  const { palette: t, name } = useTheme();
  const { ready, token } = useAuth();
  const [splash, setSplash] = useState(true);
  const [welcome, setWelcome] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    storeGet<boolean>('gv.onboarded', false).then(setOnboarded);
  }, [token]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#04010D', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#2EE6C7" />
      </View>
    );
  }

  if (splash) {
    return <SplashScreen onDone={() => setSplash(false)} />;
  }

  const navTheme = {
    ...(name === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(name === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: t.bg,
      card: t.card,
      text: t.text,
      border: t.line,
      primary: t.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!token ? (
          welcome ? (
            <RootStack.Screen name="Welcome">
              {() => <WelcomeScreen onEnter={() => setWelcome(false)} />}
            </RootStack.Screen>
          ) : (
            <RootStack.Screen name="Username" component={AuthFlow} />
          )
        ) : onboarded === false ? (
          <RootStack.Screen name="Onboarding">
            {() => <OnboardingScreen onDone={() => setOnboarded(true)} />}
          </RootStack.Screen>
        ) : (
          <>
            <RootStack.Screen name="Tabs" component={Tabs} />
            <RootStack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
            <RootStack.Screen name="NewChat" component={NewChatScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <RootStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <RootStack.Screen name="GroupInfo" component={GroupInfoScreen} />
            <RootStack.Screen name="UserProfile" component={UserProfileScreen} />
            <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
            <RootStack.Screen name="Notifications" component={NotificationsScreen} />
            <RootStack.Screen name="Blocked" component={BlockedScreen} />
            <RootStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <RootStack.Screen name="Legal" component={LegalScreen} />
            <RootStack.Screen name="Report" component={ReportScreen} options={{ presentation: 'modal' }} />
            <RootStack.Screen name="Moderation" component={ModerationScreen} />
            <RootStack.Screen name="AIModal" component={AIScreen} options={{ presentation: 'modal' }} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNav />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
