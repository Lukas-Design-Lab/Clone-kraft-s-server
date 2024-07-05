import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NewHome from '../Users/Menu/NewHome';
import Deliver from '../Users/Menu/Deliver';
import JoinRide from '../Users/Menu/JoinRide';
import User from '../Users/Menu/User';
import { Text } from 'react-native';
import Icon from 'react-native-remix-icon'; // Import Icon from remix-icon

const Tab = createBottomTabNavigator();

const tabBarIconStyle = {
  width: 24,
};

const tabBarLabelStyle = {
  fontFamily: 'Regular',
  fontSize: 18,
};

function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'white',
          paddingTop: 12,
        },
        headerStyle: {
          borderBottomWidth: 3,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={NewHome}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                tabBarLabelStyle,
                { color: focused ? '#515FDF' : '#66666666', fontSize: 14 },
              ]}>
              Home
            </Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name="home-fill" // Replace with the name of the Remix icon you want to use
              style={[
                tabBarIconStyle,
                { color: focused ? '#515FDF' : '#66666666' },
              ]}
              size={20}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Deliver"
        component={Deliver}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                tabBarLabelStyle,
                { color: focused ? '#515FDF' : '#66666666', fontSize: 14 },
              ]}>
              Deliver
            </Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name="truck-fill" // Replace with the name of the Remix icon you want to use
              style={[
                tabBarIconStyle,
                { color: focused ? '#515FDF' : '#66666666' },
              ]}
              size={20}
            />
          ),
        }}
      />
      <Tab.Screen
        name="JoinRide"
        component={JoinRide}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                tabBarLabelStyle,
                { color: focused ? '#515FDF' : '#66666666', fontSize: 14 },
              ]}>
              Join a Ride
            </Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name="car-fill" // Replace with the name of the Remix icon you want to use
              style={[
                tabBarIconStyle,
                { color: focused ? '#515FDF' : '#66666666' },
              ]}
              size={20}
            />
          ),
        }}
      />
      <Tab.Screen
        name="user"
        component={User}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                tabBarLabelStyle,
                { color: focused ? '#515FDF' : '#66666666', fontSize: 14 },
              ]}>
              Profile
            </Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name="user-fill" // Replace with the name of the Remix icon you want to use
              style={[
                tabBarIconStyle,
                { color: focused ? '#515FDF' : '#66666666' },
              ]}
              size={20}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default MyTabs;
