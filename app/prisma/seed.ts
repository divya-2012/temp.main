import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'logeshtv21@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Qwer1234@';
  const adminFirmName = process.env.ADMIN_FIRM || 'Legal AI & Associates';

  // 1. Create firm
  const firm = await prisma.firm.upsert({
    where: { id: 'seed-firm-001' },
    update: { name: adminFirmName },
    create: {
      id: 'seed-firm-001',
      name: adminFirmName,
      address: '100 Law Street, Suite 500, San Francisco, CA 94105',
      phone: '(415) 555-0100',
      website: 'https://legalai-associates.com',
    },
  });
  console.log('  ✓ Firm created:', firm.name);

  // 2. Create admin user
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: 'Logesh',
      lastName: 'TV',
      role: 'ADMIN',
      firmId: firm.id,
      isActive: true,
    },
  });
  console.log('  ✓ Admin user created:', admin.email);

  // 3. Create a second attorney
  const attorneyHash = await bcrypt.hash('Attorney@1234', 12);
  const attorney = await prisma.user.upsert({
    where: { email: 'attorney@legalai.com' },
    update: {},
    create: {
      email: 'attorney@legalai.com',
      passwordHash: attorneyHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'ATTORNEY',
      firmId: firm.id,
      isActive: true,
    },
  });
  console.log('  ✓ Attorney created:', attorney.email);

  // 4. Create sample clients
  const client1 = await prisma.client.upsert({
    where: { id: 'seed-client-001' },
    update: {},
    create: {
      id: 'seed-client-001',
      type: 'INDIVIDUAL',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      address: '456 Oak Avenue, San Francisco, CA 94102',
      firmId: firm.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'seed-client-002' },
    update: {},
    create: {
      id: 'seed-client-002',
      type: 'COMPANY',
      companyName: 'TechVenture Inc.',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'mchen@techventure.com',
      phone: '(555) 987-6543',
      address: '789 Innovation Blvd, Palo Alto, CA 94301',
      firmId: firm.id,
    },
  });

  const client3 = await prisma.client.upsert({
    where: { id: 'seed-client-003' },
    update: {},
    create: {
      id: 'seed-client-003',
      type: 'INDIVIDUAL',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@email.com',
      phone: '(555) 246-8135',
      firmId: firm.id,
    },
  });
  console.log('  ✓ Clients created:', 3);

  // 5. Create sample cases
  const case1 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2025-001',
      title: 'Smith v. Anderson Properties LLC',
      description: 'Personal injury claim arising from premises liability. Client sustained injuries due to unsafe conditions at commercial property.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      practiceArea: 'Personal Injury',
      courtName: 'San Francisco Superior Court',
      courtCaseNo: 'CGC-25-123456',
      filingDate: new Date('2025-01-15'),
      nextHearingDate: new Date('2025-08-20'),
      clientId: client1.id,
      firmId: firm.id,
    },
  });

  const case2 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2025-002',
      title: 'TechVenture Patent Infringement',
      description: 'Patent infringement action regarding software patent #US-12345. Defending client against claims by competitor.',
      status: 'OPEN',
      priority: 'URGENT',
      practiceArea: 'Intellectual Property',
      courtName: 'US District Court - Northern California',
      courtCaseNo: '5:25-cv-00789',
      filingDate: new Date('2025-02-01'),
      nextHearingDate: new Date('2025-07-15'),
      clientId: client2.id,
      firmId: firm.id,
    },
  });

  const case3 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2025-003',
      title: 'Davis Estate Planning',
      description: 'Comprehensive estate planning including will drafting, trust creation, and asset protection strategies.',
      status: 'OPEN',
      priority: 'MEDIUM',
      practiceArea: 'Estate Planning',
      clientId: client3.id,
      firmId: firm.id,
    },
  });

  const case4 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2024-015',
      title: 'Johnson Employment Dispute',
      description: 'Wrongful termination and discrimination claim. Case settled favorably.',
      status: 'CLOSED',
      priority: 'HIGH',
      practiceArea: 'Employment Law',
      clientId: client1.id,
      firmId: firm.id,
    },
  });
  console.log('  ✓ Cases created:', 4);

  // 5b. Assign attorneys to cases
  await prisma.caseAssignment.createMany({
    data: [
      { caseId: case1.id, userId: attorney.id, role: 'Lead Attorney', isLead: true },
      { caseId: case1.id, userId: admin.id, role: 'Partner' },
      { caseId: case2.id, userId: admin.id, role: 'Lead Attorney', isLead: true },
      { caseId: case2.id, userId: attorney.id, role: 'Associate' },
      { caseId: case3.id, userId: attorney.id, role: 'Lead Attorney', isLead: true },
      { caseId: case4.id, userId: admin.id, role: 'Lead Attorney', isLead: true },
    ],
  });
  console.log('  ✓ Case assignments created');

  // 6. Create timeline events
  for (const c of [case1, case2, case3]) {
    await prisma.caseTimeline.create({
      data: {
        caseId: c.id,
        userId: admin.id,
        eventType: 'CASE_CREATED',
        title: 'Case Created',
        description: `Case ${c.caseNumber} was created and assigned.`,
      },
    });
  }
  console.log('  ✓ Timeline events created');

  // 7. Create sample documents
  await prisma.document.createMany({
    data: [
      { name: 'Smith - Complaint.pdf', originalName: 'complaint.pdf', mimeType: 'application/pdf', size: 245000, storagePath: 'uploads/smith-complaint.pdf', caseId: case1.id, uploadedById: admin.id, firmId: firm.id, status: 'ANALYZED' },
      { name: 'TechVenture Patent Claims.pdf', originalName: 'patent-claims.pdf', mimeType: 'application/pdf', size: 1520000, storagePath: 'uploads/tv-patent.pdf', caseId: case2.id, uploadedById: attorney.id, firmId: firm.id, status: 'ANALYZED' },
      { name: 'Davis Will Draft v1.docx', originalName: 'will-draft.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 98000, storagePath: 'uploads/davis-will.docx', caseId: case3.id, uploadedById: attorney.id, firmId: firm.id, status: 'UPLOADED' },
      { name: 'Engagement Letter - TechVenture.pdf', originalName: 'engagement.pdf', mimeType: 'application/pdf', size: 156000, storagePath: 'uploads/tv-engagement.pdf', caseId: case2.id, uploadedById: admin.id, firmId: firm.id, status: 'ANALYZED' },
    ],
  });
  console.log('  ✓ Documents created:', 4);

  // 8. Create time entries
  await prisma.timeEntry.createMany({
    data: [
      { description: 'Case analysis and strategy development', hours: 3.5, rate: 450, amount: 1575, date: new Date('2025-06-01'), caseId: case1.id, userId: admin.id, firmId: firm.id },
      { description: 'Client meeting and case review', hours: 2.0, rate: 450, amount: 900, date: new Date('2025-06-03'), caseId: case1.id, userId: admin.id, firmId: firm.id },
      { description: 'Patent claims analysis', hours: 5.0, rate: 350, amount: 1750, date: new Date('2025-06-02'), caseId: case2.id, userId: attorney.id, firmId: firm.id },
      { description: 'Prior art research', hours: 4.0, rate: 350, amount: 1400, date: new Date('2025-06-04'), caseId: case2.id, userId: attorney.id, firmId: firm.id },
      { description: 'Estate planning consultation', hours: 1.5, rate: 450, amount: 675, date: new Date('2025-06-05'), caseId: case3.id, userId: attorney.id, firmId: firm.id },
      { description: 'Draft discovery requests', hours: 2.5, rate: 450, amount: 1125, date: new Date('2025-06-10'), caseId: case1.id, userId: admin.id, firmId: firm.id },
    ],
  });
  console.log('  ✓ Time entries created:', 6);

  // 9. Create invoices
  await prisma.invoice.createMany({
    data: [
      { invoiceNo: 'INV-2025-001', total: 2475, tax: 0, subtotal: 2475, status: 'PAID', dueDate: new Date('2025-07-01'), paidAt: new Date('2025-06-28'), clientId: client1.id, caseId: case1.id, firmId: firm.id },
      { invoiceNo: 'INV-2025-002', total: 3150, tax: 0, subtotal: 3150, status: 'SENT', dueDate: new Date('2025-07-15'), clientId: client2.id, caseId: case2.id, firmId: firm.id },
      { invoiceNo: 'INV-2025-003', total: 675, tax: 0, subtotal: 675, status: 'DRAFT', dueDate: new Date('2025-08-01'), clientId: client3.id, caseId: case3.id, firmId: firm.id },
    ],
  });
  console.log('  ✓ Invoices created:', 3);

  // 10. Create calendar events
  const now = new Date();
  await prisma.calendarEvent.createMany({
    data: [
      { title: 'Smith v. Anderson - Hearing', type: 'HEARING', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12, 0), location: 'Courtroom 5B, SF Superior Court', caseId: case1.id, createdById: admin.id, firmId: firm.id },
      { title: 'TechVenture - Discovery Deadline', type: 'DEADLINE', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 17, 0), caseId: case2.id, createdById: attorney.id, firmId: firm.id },
      { title: 'Client Meeting - Emily Davis', type: 'MEETING', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 15, 0), location: 'Office - Conference Room A', caseId: case3.id, createdById: attorney.id, firmId: firm.id },
      { title: 'Patent Expert Consultation', type: 'MEETING', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 11, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 12, 30), location: 'Video Call', caseId: case2.id, createdById: admin.id, firmId: firm.id },
      { title: 'Bar Association CLE Deadline', type: 'DEADLINE', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 23, 59), createdById: admin.id, firmId: firm.id },
    ],
  });
  console.log('  ✓ Calendar events created:', 5);

  // 11. Create compliance items
  await prisma.complianceItem.createMany({
    data: [
      { title: 'Annual Bar License Renewal', category: 'Licensing', status: 'PENDING', dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 1), riskLevel: 'HIGH', firmId: firm.id },
      { title: 'Client Trust Account Audit', category: 'Financial', status: 'PENDING', dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15), riskLevel: 'HIGH', firmId: firm.id },
      { title: 'Continuing Legal Education - Q3', category: 'Education', status: 'PENDING', dueDate: new Date(now.getFullYear(), 8, 30), riskLevel: 'MEDIUM', firmId: firm.id },
      { title: 'Data Protection Policy Review', category: 'Data Privacy', status: 'COMPLIANT', completedAt: new Date('2025-05-15'), dueDate: new Date('2025-05-30'), riskLevel: 'MEDIUM', firmId: firm.id },
      { title: 'Conflict of Interest Check - Q2', category: 'Ethics', status: 'COMPLIANT', completedAt: new Date('2025-04-01'), dueDate: new Date('2025-04-15'), riskLevel: 'LOW', firmId: firm.id },
    ],
  });
  console.log('  ✓ Compliance items created:', 5);

  // 12. Create activity log entries
  await prisma.auditLog.createMany({
    data: [
      { action: 'created case', entity: case1.title, entityId: case1.id, userId: admin.id, firmId: firm.id },
      { action: 'uploaded document', entity: 'Smith - Complaint.pdf', entityId: case1.id, userId: admin.id, firmId: firm.id },
      { action: 'created case', entity: case2.title, entityId: case2.id, userId: admin.id, firmId: firm.id },
      { action: 'added time entry', entity: 'Patent claims analysis', entityId: case2.id, userId: attorney.id, firmId: firm.id },
      { action: 'sent invoice', entity: 'INV-2025-001', entityId: case1.id, userId: admin.id, firmId: firm.id },
    ],
  });
  console.log('  ✓ Activity logs created:', 5);

  console.log('\n✅ Database seeded successfully!');
  console.log('   Admin login: logeshtv21@gmail.com / Qwer1234@');
  console.log('   Attorney login: attorney@legalai.com / Attorney@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
