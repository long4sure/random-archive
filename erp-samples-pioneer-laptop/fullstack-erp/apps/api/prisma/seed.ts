import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Users
  const adminHash = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.local' },
    update: {},
    create: { email: 'admin@erp.local', passwordHash: adminHash, firstName: 'System', lastName: 'Admin', role: UserRole.SUPER_ADMIN },
  });

  const managerHash = await bcrypt.hash('manager123!', 12);
  await prisma.user.upsert({
    where: { email: 'manager@erp.local' },
    update: {},
    create: { email: 'manager@erp.local', passwordHash: managerHash, firstName: 'Maria', lastName: 'Santos', role: UserRole.MANAGER },
  });

  console.log('✅ Users seeded');

  // Units of Measure
  const uoms = await Promise.all([
    prisma.unitOfMeasure.upsert({ where: { name: 'Piece' }, update: {}, create: { name: 'Piece', abbreviation: 'pcs', type: 'UNIT' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Kilogram' }, update: {}, create: { name: 'Kilogram', abbreviation: 'kg', type: 'WEIGHT' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Liter' }, update: {}, create: { name: 'Liter', abbreviation: 'L', type: 'VOLUME' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Meter' }, update: {}, create: { name: 'Meter', abbreviation: 'm', type: 'LENGTH' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Box' }, update: {}, create: { name: 'Box', abbreviation: 'box', type: 'UNIT' } }),
  ]);
  console.log('✅ UoMs seeded');

  // Categories
  const rawMat = await prisma.category.upsert({ where: { name: 'Raw Materials' }, update: {}, create: { name: 'Raw Materials', description: 'Input materials for production' } });
  const finishedGoods = await prisma.category.upsert({ where: { name: 'Finished Goods' }, update: {}, create: { name: 'Finished Goods', description: 'Completed manufactured products' } });
  const components = await prisma.category.upsert({ where: { name: 'Components' }, update: {}, create: { name: 'Components', description: 'Sub-assembly components' } });
  console.log('✅ Categories seeded');

  // Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: { name: 'Main Warehouse', code: 'WH-MAIN', address: '123 Industrial Blvd, Quezon City' },
  });

  const [inputLoc, outputLoc, stockLoc] = await Promise.all([
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'IN' } }, update: {}, create: { warehouseId: warehouse.id, name: 'Incoming', code: 'IN', type: 'INCOMING' } }),
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'OUT' } }, update: {}, create: { warehouseId: warehouse.id, name: 'Outgoing', code: 'OUT', type: 'OUTGOING' } }),
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'STOCK-A' } }, update: {}, create: { warehouseId: warehouse.id, name: 'Stock Zone A', code: 'STOCK-A', type: 'INTERNAL' } }),
  ]);
  console.log('✅ Warehouse seeded');

  // Products
  const products = await Promise.all([
    prisma.product.upsert({ where: { sku: 'RM-STEEL-001' }, update: {}, create: { sku: 'RM-STEEL-001', name: 'Steel Sheet 2mm', categoryId: rawMat.id, uomId: uoms[1].id, type: 'STORABLE', costPrice: 850, salePrice: 0, reorderPoint: 100, reorderQty: 500 } }),
    prisma.product.upsert({ where: { sku: 'RM-ALU-001' }, update: {}, create: { sku: 'RM-ALU-001', name: 'Aluminum Rod 10mm', categoryId: rawMat.id, uomId: uoms[1].id, type: 'STORABLE', costPrice: 1200, salePrice: 0, reorderPoint: 50, reorderQty: 200 } }),
    prisma.product.upsert({ where: { sku: 'CP-MTR-001' }, update: {}, create: { sku: 'CP-MTR-001', name: 'Electric Motor 2HP', categoryId: components.id, uomId: uoms[0].id, type: 'STORABLE', costPrice: 4500, salePrice: 0, reorderPoint: 10, reorderQty: 25 } }),
    prisma.product.upsert({ where: { sku: 'FG-PUMP-001' }, update: {}, create: { sku: 'FG-PUMP-001', name: 'Industrial Water Pump 2HP', categoryId: finishedGoods.id, uomId: uoms[0].id, type: 'STORABLE', costPrice: 8500, salePrice: 12500, reorderPoint: 5, reorderQty: 20 } }),
    prisma.product.upsert({ where: { sku: 'FG-COMP-001' }, update: {}, create: { sku: 'FG-COMP-001', name: 'Air Compressor 10L', categoryId: finishedGoods.id, uomId: uoms[0].id, type: 'STORABLE', costPrice: 6800, salePrice: 9900, reorderPoint: 5, reorderQty: 15 } }),
  ]);

  // Stock levels
  await Promise.all([
    prisma.stockLevel.upsert({ where: { productId_locationId: { productId: products[0].id, locationId: stockLoc.id } }, update: {}, create: { productId: products[0].id, locationId: stockLoc.id, quantity: 450, reservedQty: 50 } }),
    prisma.stockLevel.upsert({ where: { productId_locationId: { productId: products[1].id, locationId: stockLoc.id } }, update: {}, create: { productId: products[1].id, locationId: stockLoc.id, quantity: 180, reservedQty: 20 } }),
    prisma.stockLevel.upsert({ where: { productId_locationId: { productId: products[2].id, locationId: stockLoc.id } }, update: {}, create: { productId: products[2].id, locationId: stockLoc.id, quantity: 28, reservedQty: 5 } }),
    prisma.stockLevel.upsert({ where: { productId_locationId: { productId: products[3].id, locationId: stockLoc.id } }, update: {}, create: { productId: products[3].id, locationId: stockLoc.id, quantity: 12, reservedQty: 4 } }),
    prisma.stockLevel.upsert({ where: { productId_locationId: { productId: products[4].id, locationId: stockLoc.id } }, update: {}, create: { productId: products[4].id, locationId: stockLoc.id, quantity: 8, reservedQty: 2 } }),
  ]);
  console.log('✅ Products & stock seeded');

  // Customers
  const customers = await Promise.all([
    prisma.customer.upsert({ where: { code: 'CUST-001' }, update: {}, create: { code: 'CUST-001', name: 'Pacific Builders Corp', email: 'purchasing@pacificbuilders.ph', phone: '+63-2-8888-1234', paymentTerms: 30, creditLimit: 500000 } }),
    prisma.customer.upsert({ where: { code: 'CUST-002' }, update: {}, create: { code: 'CUST-002', name: 'Metro Infrastructure Inc', email: 'orders@metroinf.ph', phone: '+63-2-7777-5678', paymentTerms: 45, creditLimit: 1000000 } }),
    prisma.customer.upsert({ where: { code: 'CUST-003' }, update: {}, create: { code: 'CUST-003', name: 'Southern Agri Equipment', email: 'procurement@southagri.ph', phone: '+63-82-333-9012', paymentTerms: 30, creditLimit: 250000 } }),
  ]);
  console.log('✅ Customers seeded');

  // Vendors
  const vendors = await Promise.all([
    prisma.vendor.upsert({ where: { code: 'VEND-001' }, update: {}, create: { code: 'VEND-001', name: 'National Steel Supply', email: 'sales@nationalsteel.ph', phone: '+63-2-8555-4321', paymentTerms: 30 } }),
    prisma.vendor.upsert({ where: { code: 'VEND-002' }, update: {}, create: { code: 'VEND-002', name: 'Sunrise Metals Trading', email: 'orders@sunrisemetals.ph', phone: '+63-2-8444-8765', paymentTerms: 15 } }),
    prisma.vendor.upsert({ where: { code: 'VEND-003' }, update: {}, create: { code: 'VEND-003', name: 'ElectroMotors PH', email: 'supply@electromotors.ph', phone: '+63-32-255-3456', paymentTerms: 30 } }),
  ]);
  console.log('✅ Vendors seeded');

  // Departments
  const depts = await Promise.all([
    prisma.department.upsert({ where: { code: 'PROD' }, update: {}, create: { name: 'Production', code: 'PROD' } }),
    prisma.department.upsert({ where: { code: 'SALES' }, update: {}, create: { name: 'Sales', code: 'SALES' } }),
    prisma.department.upsert({ where: { code: 'FINANCE' }, update: {}, create: { name: 'Finance', code: 'FINANCE' } }),
    prisma.department.upsert({ where: { code: 'HR' }, update: {}, create: { name: 'Human Resources', code: 'HR' } }),
    prisma.department.upsert({ where: { code: 'WHSE' }, update: {}, create: { name: 'Warehouse', code: 'WHSE' } }),
  ]);

  // Employees
  await Promise.all([
    prisma.employee.upsert({ where: { employeeId: 'EMP-001' }, update: {}, create: { employeeId: 'EMP-001', firstName: 'Juan', lastName: 'dela Cruz', email: 'juan.delacruz@erp.local', position: 'Production Supervisor', departmentId: depts[0].id, hireDate: new Date('2021-03-15'), baseSalary: 35000 } }),
    prisma.employee.upsert({ where: { employeeId: 'EMP-002' }, update: {}, create: { employeeId: 'EMP-002', firstName: 'Ana', lastName: 'Reyes', email: 'ana.reyes@erp.local', position: 'Sales Representative', departmentId: depts[1].id, hireDate: new Date('2022-06-01'), baseSalary: 28000 } }),
    prisma.employee.upsert({ where: { employeeId: 'EMP-003' }, update: {}, create: { employeeId: 'EMP-003', firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.mendoza@erp.local', position: 'Accountant', departmentId: depts[2].id, hireDate: new Date('2020-11-20'), baseSalary: 32000 } }),
  ]);
  console.log('✅ HR seeded');

  // Chart of Accounts
  await Promise.all([
    prisma.account.upsert({ where: { code: '1000' }, update: {}, create: { code: '1000', name: 'Cash and Cash Equivalents', type: 'ASSET', normalSide: 'DEBIT' } }),
    prisma.account.upsert({ where: { code: '1200' }, update: {}, create: { code: '1200', name: 'Accounts Receivable', type: 'ASSET', normalSide: 'DEBIT' } }),
    prisma.account.upsert({ where: { code: '1400' }, update: {}, create: { code: '1400', name: 'Inventory', type: 'ASSET', normalSide: 'DEBIT' } }),
    prisma.account.upsert({ where: { code: '2000' }, update: {}, create: { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', normalSide: 'CREDIT' } }),
    prisma.account.upsert({ where: { code: '3000' }, update: {}, create: { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY', normalSide: 'CREDIT' } }),
    prisma.account.upsert({ where: { code: '4000' }, update: {}, create: { code: '4000', name: 'Sales Revenue', type: 'REVENUE', normalSide: 'CREDIT' } }),
    prisma.account.upsert({ where: { code: '5000' }, update: {}, create: { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', normalSide: 'DEBIT' } }),
    prisma.account.upsert({ where: { code: '5100' }, update: {}, create: { code: '5100', name: 'Salaries & Wages', type: 'EXPENSE', normalSide: 'DEBIT' } }),
  ]);
  console.log('✅ Chart of Accounts seeded');

  // Work Center
  await prisma.workCenter.upsert({
    where: { code: 'WC-ASSY' },
    update: {},
    create: { name: 'Assembly Line 1', code: 'WC-ASSY', capacity: 8, costPerHour: 500 },
  });
  console.log('✅ Work centers seeded');

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────');
  console.log('Admin login:   admin@erp.local / admin123!');
  console.log('Manager login: manager@erp.local / manager123!');
  console.log('─────────────────────────────────');
}

main().catch(console.error).finally(() => prisma.$disconnect());
