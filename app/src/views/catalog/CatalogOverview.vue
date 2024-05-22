<template>
  <v-row justify="space-between" align="center" class="mb-1">
    <v-col cols="auto" class="text-h4">
      Meine Kataloge ({{ catalogs.length }}/{{ MAX_CATALOGS }})
    </v-col>
  </v-row>
  <v-divider/>
    <v-row>
      <v-col>
        <v-list>
          <v-list-item
              v-for="catalog in examples"
              :key="catalog.catalog_id"
              @click="openCatalogDetails(catalog.catalog_id)"
              border
              variant="outlined"
              rounded
              base-color="info"
              min-height="80px"
              ripple
              elevation="7"
              class="ma-5"
              subtitle="Beispielkatalog"
          >
            <v-list-item-title>{{ catalog.catalog_name }}</v-list-item-title>
            <template v-slot:prepend>
              <v-icon>
                mdi-newspaper-variant
              </v-icon>
            </template>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>
        <v-list>
          <v-list-item
              v-for="catalog in catalogs"
              :key="catalog.catalog_id"
              @click="openCatalogDetails(catalog.catalog_id)"
              border
              variant="outlined"
              rounded
              min-height="80px"
              ripple
              elevation="12"
              class="ma-5"
          >
            <v-list-item-title>{{ catalog.catalog_name }}</v-list-item-title>
            <template v-slot:prepend>
              <v-icon>
                mdi-newspaper-variant
              </v-icon>
            </template>
            <template v-slot:append>
              <v-btn-group
                  variant="outlined"
                  elevation="24"
                  divided
                  density="default"
              >
                <v-btn
                    @click.stop="openDeleteDialog(catalog.catalog_id)"
                    color="error"
                >
                  Löschen
                </v-btn>
              </v-btn-group>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-btn
            color="primary"
            @click="router.push({path: '/catalogs/upload'})"
            block
            :disabled="catalogs.length >= MAX_CATALOGS"
        >
          Katalog hochladen
        </v-btn>
      </v-col>
    </v-row>
</template>

<script setup lang="ts">

import {useCatalogStore} from "@/stores/catalog.ts";
import router from "@/router";
import alertService from "@/services/util/alert.ts";

const catalogStore = useCatalogStore();
const catalogs = catalogStore.getCustomCatalogs;
const examples = catalogStore.getExampleCatalogs;

const MAX_CATALOGS = 5;

async function openCatalogDetails(catalogId: number) {
  await router.push({name: "CatalogDetails", params: {catalogId: catalogId}});
}

function openDeleteDialog(catalogId: number) {
  alertService.openDialog(
      "Katalog löschen",
      "Möchtest du den Katalog wirklich löschen? Das löschen ist unwiederruflich und weitet sich auf alle Lektionen aus, die diesen Katalog nutzen.",
      "Ja",
      "Nein",
      () => deleteCatalog(catalogId)
  )
}

function deleteCatalog(catalogId: number): void {
  catalogStore.deleteCatalog(catalogId)
      .then(() => {
        alertService.addSuccessAlert("Katalog gelöscht")
      })
}

</script>
  