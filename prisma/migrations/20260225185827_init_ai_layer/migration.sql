-- CreateTable
CREATE TABLE "demo_hotel_customers" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "notes" TEXT,
    "callCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_hotel_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_hotel_bookings" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,

    CONSTRAINT "demo_hotel_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_hotel_call_transcripts" (
    "id" TEXT NOT NULL,
    "vapiCallId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "summary" TEXT,
    "bookingsMade" TEXT[],
    "cancelledRooms" TEXT[],
    "customerId" TEXT,

    CONSTRAINT "demo_hotel_call_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_hotel_crm_records" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "notes" TEXT,
    "summary" TEXT,
    "bookedRooms" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,

    CONSTRAINT "demo_hotel_crm_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_hotel_staff_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'receptionist',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "demo_hotel_staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demo_hotel_customers_phone_key" ON "demo_hotel_customers"("phone");

-- CreateIndex
CREATE INDEX "demo_hotel_customers_phone_idx" ON "demo_hotel_customers"("phone");

-- CreateIndex
CREATE INDEX "demo_hotel_customers_name_idx" ON "demo_hotel_customers"("name");

-- CreateIndex
CREATE INDEX "demo_hotel_bookings_roomId_idx" ON "demo_hotel_bookings"("roomId");

-- CreateIndex
CREATE INDEX "demo_hotel_bookings_customerId_idx" ON "demo_hotel_bookings"("customerId");

-- CreateIndex
CREATE INDEX "demo_hotel_bookings_checkIn_checkOut_idx" ON "demo_hotel_bookings"("checkIn", "checkOut");

-- CreateIndex
CREATE UNIQUE INDEX "demo_hotel_call_transcripts_vapiCallId_key" ON "demo_hotel_call_transcripts"("vapiCallId");

-- CreateIndex
CREATE INDEX "demo_hotel_call_transcripts_vapiCallId_idx" ON "demo_hotel_call_transcripts"("vapiCallId");

-- CreateIndex
CREATE INDEX "demo_hotel_call_transcripts_customerId_idx" ON "demo_hotel_call_transcripts"("customerId");

-- CreateIndex
CREATE INDEX "demo_hotel_crm_records_customerId_idx" ON "demo_hotel_crm_records"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "demo_hotel_staff_users_email_key" ON "demo_hotel_staff_users"("email");

-- CreateIndex
CREATE INDEX "demo_hotel_staff_users_email_idx" ON "demo_hotel_staff_users"("email");

-- AddForeignKey
ALTER TABLE "demo_hotel_bookings" ADD CONSTRAINT "demo_hotel_bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "demo_hotel_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_hotel_call_transcripts" ADD CONSTRAINT "demo_hotel_call_transcripts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "demo_hotel_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_hotel_crm_records" ADD CONSTRAINT "demo_hotel_crm_records_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "demo_hotel_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
