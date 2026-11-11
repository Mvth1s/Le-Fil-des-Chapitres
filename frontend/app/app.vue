<template>
  <div>
    <NuxtRouteAnnouncer />
    <a href="#contenu" class="skip-link">Aller au contenu</a>
    <AppNavbar />
    <!-- Cible du lien d'evitement : chaque page porte son propre <main>. -->
    <div id="contenu" tabindex="-1">
      <NuxtPage />
    </div>
    <AppToast />
  </div>
</template>
