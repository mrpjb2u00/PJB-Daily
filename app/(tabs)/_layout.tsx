import { isLiquidGlassAvailable } from "expo-glass-effect";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CustomTabBar } from "@/components/CustomTabBar";
import WelcomeContent from "@/components/WelcomeContent";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="calendar">
        <Icon sf={{ default: "calendar", selected: "calendar.circle.fill" }} androidSrc={<VectorIcon family={MaterialIcons} name="calendar-today" />} />
        <Label>Calendar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "checklist", selected: "checklist" }} androidSrc={<VectorIcon family={MaterialIcons} name="check-box" />} />
        <Label>To-Dos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notes">
        <Icon sf={{ default: "note.text", selected: "note.text" }} androidSrc={<VectorIcon family={MaterialIcons} name="note" />} />
        <Label>Notes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} androidSrc={<VectorIcon family={MaterialIcons} name="account-circle" />} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  return (
    <Tabs
      initialRouteName="calendar"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="index" options={{ title: 'To-Dos' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <WelcomeContent />;
  }

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
