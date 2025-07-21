// Utility to update Firestore with new CEDOI members
import { api } from '@/lib/api';
import type { User } from '@shared/schema';

const newMembers = [
  {
    email: "sonai@cedoi.com",
    name: "Sonai",
    company: "CEDOI Administration",
    role: "sonai" as const,
    qrCode: "sonai_qr_123"
  },
  {
    email: "chairman@cedoi.com",
    name: "Chairman",
    company: "CEDOI Board",
    role: "chairman" as const,
    qrCode: "chairman_qr_456"
  },
  {
    email: "andrew.ananth@cedoi.com",
    name: "Andrew Ananth",
    company: "Godivatech",
    role: "member" as const,
    qrCode: "andrew_qr_789"
  },
  {
    email: "dr.aafaq@cedoi.com",
    name: "Dr Aafaq",
    company: "zaara dentistry",
    role: "member" as const,
    qrCode: "aafaq_qr_101"
  },
  {
    email: "vignesh.pavin@cedoi.com",
    name: "Vignesh",
    company: "Pavin caters",
    role: "member" as const,
    qrCode: "vignesh_p_qr_102"
  },
  {
    email: "vignesh.aloka@cedoi.com",
    name: "Vignesh",
    company: "Aloka Events",
    role: "member" as const,
    qrCode: "vignesh_a_qr_103"
  },
  {
    email: "imran@cedoi.com",
    name: "Imran",
    company: "MK Trading",
    role: "member" as const,
    qrCode: "imran_qr_104"
  },
  {
    email: "radha.krishnan@cedoi.com",
    name: "Radha Krishnan",
    company: "Surya Crackers",
    role: "member" as const,
    qrCode: "radha_qr_105"
  },
  {
    email: "mukesh@cedoi.com",
    name: "Mukesh",
    company: "Tamilnadu Electricals",
    role: "member" as const,
    qrCode: "mukesh_qr_106"
  },
  {
    email: "shanmuga.pandiyan@cedoi.com",
    name: "Shanmuga Pandiyan",
    company: "Shree Mariamma Group",
    role: "member" as const,
    qrCode: "shanmuga_qr_107"
  },
  {
    email: "muthukumar@cedoi.com",
    name: "Muthukumar",
    company: "PR Systems",
    role: "member" as const,
    qrCode: "muthukumar_qr_108"
  },
  {
    email: "prabu@cedoi.com",
    name: "Prabu",
    company: "Cleaning solutions",
    role: "member" as const,
    qrCode: "prabu_qr_109"
  },
  {
    email: "jaffer@cedoi.com",
    name: "Jaffer",
    company: "Spice King",
    role: "member" as const,
    qrCode: "jaffer_qr_110"
  }
];

export async function updateFirestoreMembers() {
  try {
    console.log('🗑️ Clearing existing users from Firestore...');
    const deletedCount = await api.users.deleteAll();
    console.log(`✅ Deleted ${deletedCount} existing users`);

    console.log('👥 Adding new CEDOI members...');
    const createdUsers = await api.users.bulkCreate(newMembers);
    console.log(`✅ Created ${createdUsers.length} new members`);

    console.log('🎉 Member update completed successfully!');
    return createdUsers;
  } catch (error) {
    console.error('❌ Failed to update members:', error);
    throw error;
  }
}

// Make it available globally for testing
(window as any).updateFirestoreMembers = updateFirestoreMembers;console.log('📱 CEDOI Member Management Available'); console.log('Run updateFirestoreMembers() in console to update members in Firestore'); if (typeof window !== 'undefined') { window.addEventListener('load', () => { console.log('🔧 Member update function available: updateFirestoreMembers()'); }); }
