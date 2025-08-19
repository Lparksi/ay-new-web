<template>
  <t-layout style="height: 100vh;">
    <t-aside width="232px">
      <side-menu />
    </t-aside>

    <t-layout style="flex: 1; display: flex; flex-direction: column;">
      <t-header style="flex: 0 0 auto;">
        <nav-bar />
      </t-header>
      <t-content style="padding: 16px; flex: 1 1 auto; overflow: auto;">
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import SideMenu from './components/SideMenu.vue'
// 注册本地组件以便模板使用
const navBar = NavBar
const sideMenu = SideMenu
</script>
