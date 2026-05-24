// src/utils/seed.js
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/database");

async function seed() {
  console.log("🌱 Seeding MediSpring database...");

  // ─── Users ──────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash("medispring123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@medispring.com" },
    update: {},
    create: { firstName: "Rohan", lastName: "Admin", email: "admin@medispring.com", password, role: "ADMIN", phone: "+91 99000 00001" },
  });

  console.log("✅ Admin user created:", adminUser.email);

  // ─── Doctor users + Doctor profiles ─────────────────────────────────────────
  const doctorsData = [
    { name: "Dr. Anjali Verma",   spec: "Cardiology",    exp: 14, rating: 4.9, fee: 800,  avail: "Mon-Fri",  status: "ON_CALL",  email: "anjali@medispring.com" },
    { name: "Dr. Imran Khan",     spec: "Radiology",     exp: 9,  rating: 4.7, fee: 600,  avail: "Tue-Sat",  status: "AVAILABLE", email: "imran@medispring.com" },
    { name: "Dr. Priyanka Bose",  spec: "Pediatrics",    exp: 11, rating: 4.8, fee: 500,  avail: "Mon-Sat",  status: "IN_SURGERY", email: "priyanka@medispring.com" },
    { name: "Dr. Rajesh Rao",     spec: "Pathology",     exp: 16, rating: 4.6, fee: 400,  avail: "Mon-Fri",  status: "AVAILABLE", email: "rajesh@medispring.com" },
    { name: "Dr. Sameer Kapoor",  spec: "Orthopedics",   exp: 12, rating: 4.8, fee: 700,  avail: "Wed-Sun",  status: "AVAILABLE", email: "sameer@medispring.com" },
    { name: "Dr. Neha Saxena",    spec: "Neurology",     exp: 13, rating: 4.9, fee: 900,  avail: "Mon-Thu",  status: "ON_LEAVE",  email: "neha@medispring.com" },
    { name: "Dr. Arjun Desai",    spec: "Oncology",      exp: 18, rating: 5.0, fee: 1200, avail: "Mon-Fri",  status: "AVAILABLE", email: "arjun@medispring.com" },
    { name: "Dr. Kavya Reddy",    spec: "Dermatology",   exp: 7,  rating: 4.7, fee: 450,  avail: "Tue-Sat",  status: "AVAILABLE", email: "kavya@medispring.com" },
  ];

  const doctors = [];
  for (const d of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { firstName: d.name.split(" ")[1], lastName: d.name.split(" ").slice(2).join(" "), email: d.email, password, role: "DOCTOR" },
    });
    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, name: d.name, specialization: d.spec,
        experience: d.exp, rating: d.rating, consultationFee: d.fee,
        availability: d.avail, status: d.status, email: d.email,
      },
    });
    doctors.push(doctor);
  }
  console.log(`✅ ${doctors.length} doctors seeded`);

  // ─── Wards ──────────────────────────────────────────────────────────────────
  const wardsData = [
    { name: "ICU", type: "ICU", capacity: 24 },
    { name: "General Ward A", type: "GENERAL", capacity: 40 },
    { name: "General Ward B", type: "GENERAL", capacity: 40 },
    { name: "Maternity", type: "MATERNITY", capacity: 30 },
    { name: "Pediatric", type: "PEDIATRIC", capacity: 40 },
    { name: "Surgery Recovery", type: "SURGERY", capacity: 18 },
  ];

  const wards = [];
  for (const w of wardsData) {
    const ward = await prisma.ward.upsert({
      where: { name: w.name },
      update: {},
      create: w,
    });
    wards.push(ward);
  }
  console.log(`✅ ${wards.length} wards seeded`);

  // ─── Beds ────────────────────────────────────────────────────────────────────
  let bedCount = 0;
  for (const ward of wards) {
    const existing = await prisma.bed.count({ where: { wardId: ward.id } });
    if (existing === 0) {
      const bedStatuses = ["FREE","FREE","FREE","FREE","FREE","OCCUPIED","OCCUPIED","OCCUPIED","CLEANING","FREE"];
      for (let i = 1; i <= ward.capacity; i++) {
        await prisma.bed.create({
          data: {
            bedNumber: `${ward.name.slice(0,3).toUpperCase()}-${String(i).padStart(2,"0")}`,
            wardId: ward.id,
            status: bedStatuses[i % bedStatuses.length],
          },
        });
        bedCount++;
      }
    }
  }
  console.log(`✅ ${bedCount} beds seeded`);

  // ─── Patients ────────────────────────────────────────────────────────────────
  const patientsData = [
    { fn: "Aarav",   ln: "Mehta",   gender: "Male",   age: 42, blood: "O+",  phone: "+91 98000 12345", email: "aarav@example.com",    cond: "Hypertension", risk: "HIGH" },
    { fn: "Sneha",   ln: "Iyer",    gender: "Female", age: 29, blood: "A-",  phone: "+91 98000 22987", email: "sneha@example.com",    cond: "Migraine",     risk: "LOW" },
    { fn: "Rahul",   ln: "Singh",   gender: "Male",   age: 8,  blood: "B+",  phone: "+91 98000 88123", email: "guardian@example.com", cond: "Asthma",       risk: "MEDIUM" },
    { fn: "Priya",   ln: "Nair",    gender: "Female", age: 56, blood: "AB+", phone: "+91 98000 22112", email: "priya@example.com",    cond: "Diabetes T2",  risk: "HIGH" },
    { fn: "Vikram",  ln: "Patel",   gender: "Male",   age: 67, blood: "O-",  phone: "+91 98000 99221", email: "vikram@example.com",   cond: "Arthritis",    risk: "MEDIUM" },
    { fn: "Ananya",  ln: "Sharma",  gender: "Female", age: 33, blood: "B-",  phone: "+91 98000 76543", email: "ananya@example.com",   cond: "Pregnancy",    risk: "LOW" },
    { fn: "Kabir",   ln: "Khan",    gender: "Male",   age: 51, blood: "A+",  phone: "+91 98000 41028", email: "kabir@example.com",    cond: "Cardiac",      risk: "HIGH" },
    { fn: "Meera",   ln: "Joshi",   gender: "Female", age: 24, blood: "O+",  phone: "+91 98000 92834", email: "meera@example.com",    cond: "Allergy",      risk: "LOW" },
  ];

  const patients = [];
  for (let i = 0; i < patientsData.length; i++) {
    const p = patientsData[i];
    const pid = `PT-${1035 + i}`;
    const existing = await prisma.patient.findUnique({ where: { patientId: pid } });
    if (!existing) {
      const patient = await prisma.patient.create({
        data: {
          patientId: pid, firstName: p.fn, lastName: p.ln, gender: p.gender,
          age: p.age, bloodGroup: p.blood, phone: p.phone, email: p.email,
          currentCondition: p.cond, riskLevel: p.risk,
        },
      });
      patients.push(patient);
    } else {
      patients.push(existing);
    }
  }
  console.log(`✅ ${patientsData.length} patients seeded`);

  // ─── Appointments ─────────────────────────────────────────────────────────────
  const apptCount = await prisma.appointment.count();
  if (apptCount === 0) {
    const today = new Date();
    const appts = [
      { pi: 0, di: 0, time: "10:00", reason: "Cardiac follow-up", status: "COMPLETED" },
      { pi: 1, di: 1, time: "11:00", reason: "MRI scan",          status: "IN_PROGRESS" },
      { pi: 2, di: 2, time: "12:00", reason: "Pediatric checkup", status: "SCHEDULED" },
      { pi: 3, di: 3, time: "09:00", reason: "Lab consultation",  status: "COMPLETED" },
      { pi: 4, di: 4, time: "14:00", reason: "Orthopedic eval",   status: "SCHEDULED" },
    ];
    for (const a of appts) {
      await prisma.appointment.create({
        data: {
          patientId: patients[a.pi].id, doctorId: doctors[a.di].id,
          appointmentDate: today, appointmentTime: a.time,
          reason: a.reason, status: a.status,
          tokenNumber: `A-${appts.indexOf(a) + 10}`,
        },
      });
    }
    console.log("✅ Sample appointments seeded");
  }

  // ─── Bills ────────────────────────────────────────────────────────────────────
  const billCount = await prisma.bill.count();
  if (billCount === 0) {
    const billsData = [
      { pi: 0, amt: 1820, method: "CARD",      status: "PAID" },
      { pi: 1, amt: 640,  method: "UPI",       status: "PAID" },
      { pi: 2, amt: 2410, method: "INSURANCE", status: "PENDING" },
      { pi: 3, amt: 980,  method: "CASH",      status: "PAID" },
      { pi: 4, amt: 4520, method: "INSURANCE", status: "OVERDUE" },
      { pi: 5, amt: 3140, method: "CARD",      status: "PAID" },
      { pi: 6, amt: 720,  method: "UPI",       status: "PENDING" },
    ];
    for (let i = 0; i < billsData.length; i++) {
      const b = billsData[i];
      await prisma.bill.create({
        data: {
          invoiceNumber: `INV-${2042 + i}`,
          patientId: patients[b.pi].id,
          amount: b.amt, totalAmount: b.amt,
          paymentMethod: b.method, paymentStatus: b.status,
          paidAt: b.status === "PAID" ? new Date() : null,
        },
      });
    }
    console.log("✅ Sample bills seeded");
  }

  // ─── Lab Tests ────────────────────────────────────────────────────────────────
  const labCount = await prisma.labTest.count();
  if (labCount === 0) {
    const labs = [
      { pi: 0, name: "Complete Blood Count",  cat: "Hematology",   status: "IN_PROGRESS",      isCritical: true },
      { pi: 1, name: "Lipid Profile",          cat: "Biochemistry", status: "SAMPLE_COLLECTED",  isCritical: false },
      { pi: 3, name: "MRI Brain",              cat: "Radiology",    status: "PENDING",           isCritical: false },
      { pi: 6, name: "Thyroid Panel",          cat: "Endocrine",    status: "IN_PROGRESS",       isCritical: false },
      { pi: 6, name: "Troponin T",             cat: "Cardiac",      status: "COMPLETED",         isCritical: true,  result: "Elevated 1.8 ng/mL" },
      { pi: 3, name: "HbA1c",                  cat: "Diabetes",     status: "COMPLETED",         isCritical: true,  result: "11.4%" },
    ];
    for (const l of labs) {
      await prisma.labTest.create({
        data: {
          patientId: patients[l.pi].id,
          doctorId: doctors[0].id,
          testName: l.name,
          testCategory: l.cat,
          status: l.status,
          isCritical: l.isCritical,
          testResult: l.result || null,
        },
      });
    }
    console.log("✅ Sample lab tests seeded");
  }

  // ─── Notifications ───────────────────────────────────────────────────────────
  const notifCount = await prisma.notification.count();
  if (notifCount === 0) {
    const notifs = [
      { title: "Code Blue · ICU-3",       message: "Patient #4827 cardiac arrest. Emergency team paged.", type: "EMERGENCY", isRead: false },
      { title: "Appointment confirmed",   message: "Aarav Mehta booked with Dr. Verma at 10:30.",         type: "APPOINTMENT", isRead: false },
      { title: "Outstanding payment",     message: "Invoice INV-2044 overdue · ₹4,520 · Vikram Patel.",   type: "BILLING",     isRead: false },
      { title: "Lab results ready",       message: "MRI report for PT-1039 available for review.",         type: "LAB_RESULT",  isRead: true },
      { title: "New patient registered",  message: "Meera Joshi · PT-1035 onboarded by reception.",        type: "GENERAL",     isRead: true },
      { title: "Pharmacy low stock",      message: "Insulin Glargine below reorder threshold.",             type: "SYSTEM",      isRead: true },
    ];
    for (const n of notifs) {
      await prisma.notification.create({ data: n });
    }
    console.log("✅ Sample notifications seeded");
  }

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Demo credentials:");
  console.log("   Admin:  admin@medispring.com / medispring123");
  console.log("   Doctor: anjali@medispring.com / medispring123");
}

seed()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
