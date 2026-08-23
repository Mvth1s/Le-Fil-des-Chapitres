<script setup lang="ts">
const inputValue = ref('')
const selectValue = ref('reading')

const statusOptions = [
  { label: 'En cours', value: 'reading' },
  { label: 'Terminé', value: 'completed' },
  { label: 'En pause', value: 'on_hold' },
  { label: 'Abandonné', value: 'dropped' },
  { label: 'À lire', value: 'plan_to_read' },
]
</script>

<template>
  <main class="page">
    <h1>Design system</h1>
    <p class="text-muted">
      Page de démonstration des composants du design system — étape 5 de la roadmap. Pas destinée
      aux utilisateurs finaux.
    </p>

    <section>
      <h2>Boutons</h2>
      <div class="row">
        <AppButton variant="primary">Primaire</AppButton>
        <AppButton variant="secondary">Secondaire</AppButton>
        <AppButton variant="outline">Contour</AppButton>
        <AppButton variant="ghost">Discret</AppButton>
        <AppButton variant="primary" disabled>Désactivé</AppButton>
      </div>
    </section>

    <section>
      <h2>Badges</h2>
      <div class="row">
        <AppBadge variant="reading">En cours</AppBadge>
        <AppBadge variant="completed">Terminé</AppBadge>
        <AppBadge variant="on_hold">En pause</AppBadge>
        <AppBadge variant="dropped">Abandonné</AppBadge>
        <AppBadge variant="plan_to_read">À lire</AppBadge>
      </div>
    </section>

    <section>
      <h2>Champs de formulaire</h2>
      <div class="row">
        <AppInput v-model="inputValue" label="Titre du webtoon" placeholder="Ex : Solo Leveling" />
        <AppInput label="Champ en erreur" error="Ce champ est obligatoire." />
        <AppSelect v-model="selectValue" label="Statut" :options="statusOptions" />
      </div>
    </section>

    <section>
      <h2>Carte</h2>
      <AppCard style="max-width: 320px">
        <template #header>
          <h3>Solo Leveling</h3>
        </template>
        <p>Chugong — 200 chapitres</p>
        <AppBadge variant="reading">En cours</AppBadge>
        <template #footer>
          <AppButton size="sm" variant="outline">Voir la fiche</AppButton>
        </template>
      </AppCard>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 960px;
  margin: 0 auto;
}

section {
  margin-top: var(--spacing-xl);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: flex-start;
}
</style>
