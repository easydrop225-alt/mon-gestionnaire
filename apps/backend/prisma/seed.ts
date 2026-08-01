import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Permissions de base du système, structure "module.action" (13_AUTHENTICATION_RBAC.md §13).
 * Exécuté une seule fois par environnement : npm run prisma:seed --workspace=apps/backend
 */
const PERMISSIONS: Array<{ code: string; module: string; action: string; description: string }> = [
  { code: 'products.read', module: 'products', action: 'read', description: 'Consulter les produits' },
  { code: 'products.create', module: 'products', action: 'create', description: 'Créer des produits' },
  { code: 'products.update', module: 'products', action: 'update', description: 'Modifier des produits' },
  { code: 'products.delete', module: 'products', action: 'delete', description: 'Supprimer des produits' },

  { code: 'stock.read', module: 'stock', action: 'read', description: 'Consulter le stock' },
  { code: 'stock.adjust', module: 'stock', action: 'adjust', description: 'Ajuster le stock' },

  { code: 'clients.read', module: 'clients', action: 'read', description: 'Consulter les clients' },
  { code: 'clients.create', module: 'clients', action: 'create', description: 'Créer des clients' },
  { code: 'clients.update', module: 'clients', action: 'update', description: 'Modifier des clients' },
  { code: 'clients.delete', module: 'clients', action: 'delete', description: 'Supprimer des clients' },

  { code: 'orders.read', module: 'orders', action: 'read', description: 'Consulter les commandes' },
  { code: 'orders.create', module: 'orders', action: 'create', description: 'Créer des commandes' },
  { code: 'orders.validate', module: 'orders', action: 'validate', description: 'Valider des commandes' },
  { code: 'orders.cancel', module: 'orders', action: 'cancel', description: 'Annuler des commandes' },

  { code: 'users.invite', module: 'users', action: 'invite', description: 'Inviter des utilisateurs' },
  { code: 'users.manage', module: 'users', action: 'manage', description: 'Gérer les utilisateurs' },
  { code: 'settings.manage', module: 'settings', action: 'manage', description: 'Gérer les paramètres' },

  // Commercialisation / licence — utilisé par le module access-codes et payments.
  { code: 'licenses.manage', module: 'licenses', action: 'manage', description: 'Gérer la licence et générer des codes d\'accès' },
];

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }
  console.log(`Seed terminé : ${PERMISSIONS.length} permissions vérifiées/créées.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
