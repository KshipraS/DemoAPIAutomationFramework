/**
 * Local replica of the Banking API (http://64.227.160.186:8080).
 * Covers all controllers from the real /v3/api-docs spec:
 *   Authentication, User Management, account-controller, admin-controller,
 *   kyc-controller, mock-upi-controller, report-controller, transaction-controller.
 *
 * Run:
 *   npm install
 *   node server.js
 *
 * Then in config.properties:
 *   base.url=http://localhost:8080
 *
 * Swagger UI: http://localhost:8080/swagger-ui/  (do NOT add index.html)
 */

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const app = express();
app.use(express.json());
app.use(express.text({ type: "*/*" }));

const PORT = 8080;

// =====================================================================
// Swagger UI
// =====================================================================
const openapiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, "openapi.json"), "utf8"));
app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: false }));

// =====================================================================
// In-memory data store
// =====================================================================
const users = new Map();      // usernameLower -> user
const usersById = new Map();  // id -> usernameLower
const accounts = new Map();   // accountNumber -> account
const transactions = [];      // array of transaction records
const kycRecords = new Map(); // usernameLower -> kyc record
const tokens = new Map();     // token -> usernameLower
const resetTokens = new Map();// token -> usernameLower
const pendingTransfers = new Map(); // transactionId -> pending transfer
const upiPayments = new Map();      // transactionRef -> payment record

let nextUserId = 4000;
let nextTxnId = 1;

function seedUser({ id, username, password, email, firstName, lastName, mobileNumber, roles }) {
  const key = username.toLowerCase();
  const user = { id, username: key, password, email, firstName, lastName, mobileNumber, roles, active: true };
  users.set(key, user);
  usersById.set(id, key);
  return user;
}

seedUser({
  id: 3096,
  username: "kshipra",
  password: "Kshipra123",
  email: "kships26@gmail.com",
  firstName: "Kshipra",
  lastName: "Bhutani",
  mobileNumber: "9856565654",
  roles: ["ROLE_USER"],
});

seedUser({
  id: 1,
  username: "admin",
  password: "Admin123",
  email: "admin@mockbank.com",
  firstName: "Admin",
  lastName: "User",
  mobileNumber: "9000000000",
  roles: ["ROLE_ADMIN", "ROLE_USER"],
});

accounts.set("AC100000001", {
  accountNumber: "AC100000001",
  ownerUsername: "kshipra",
  accountType: "SAVINGS",
  balance: 50000,
  status: "ACTIVE",
  branch: "Noida",
  createdAt: new Date().toISOString(),
  ownerName: "Kshipra Bhutani",
});

// =====================================================================
// Helpers
// =====================================================================
function genDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}
function genAccountNumber() {
  let num;
  do {
    num = "AC" + genDigits(9);
  } while (accounts.has(num));
  return num;
}
function genTxnRef(prefix = "TXN") {
  return `${prefix}${Date.now()}${genDigits(4)}`;
}
function makeToken(username) {
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, username);
  return token;
}
function toProfileResponse(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    mobileNumber: user.mobileNumber,
  };
}
function toAccountResponse(acc) {
  return {
    accountNumber: acc.accountNumber,
    accountType: acc.accountType,
    balance: acc.balance,
    status: acc.status,
    branch: acc.branch,
    createdAt: acc.createdAt,
    ownerName: acc.ownerName,
  };
}
function toTxnResponse(t) {
  return {
    id: t.id,
    transactionReference: t.transactionReference,
    sourceAccount: t.sourceAccount,
    targetAccount: t.targetAccount,
    amount: t.amount,
    balanceAfterTransaction: t.balanceAfterTransaction,
    type: t.type,
    status: t.status,
    description: t.description,
    transactionDate: t.transactionDate,
  };
}
function paginate(arr, page = 0, size = 10) {
  const p = Number(page) || 0;
  const s = Number(size) || 10;
  const start = p * s;
  return {
    content: arr.slice(start, start + s),
    page: p,
    size: s,
    totalElements: arr.length,
    totalPages: Math.ceil(arr.length / s),
  };
}

function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  const username = tokens.get(token);
  if (!username || !users.has(username)) {
    return res.status(401).json({ message: "Invalid or missing token" });
  }
  req.username = username;
  req.user = users.get(username);
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user.roles.includes("ROLE_ADMIN")) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
function requireAccountOwnerOrAdmin(getAccountNumber) {
  return (req, res, next) => {
    const accNum = getAccountNumber(req);
    const acc = accounts.get(accNum);
    if (!acc) return res.status(404).json({ message: "Account not found" });
    if (acc.ownerUsername !== req.username && !req.user.roles.includes("ROLE_ADMIN")) {
      return res.status(403).json({ message: "You do not have access to this account" });
    }
    req.account = acc;
    next();
  };
}

// =====================================================================
// AUTHENTICATION
// =====================================================================
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = users.get(String(username || "").toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid username or password" });
  }
  if (!user.active) {
    return res.status(403).json({ message: "Account is deactivated" });
  }

  const token = makeToken(user.username);
  res.status(200).json({
    token,
    type: "Bearer",
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles,
  });
});

app.post("/api/auth/signup", (req, res) => {
  const { username, password, email, firstName, lastName, mobileNumber } = req.body || {};
  const key = String(username || "").toLowerCase();

  if (!key || key.length < 4) return res.status(400).type("text/plain").send("Error: username must be at least 4 characters");
  if (!password || password.length < 6) return res.status(400).type("text/plain").send("Error: password must be at least 6 characters");
  if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) return res.status(400).type("text/plain").send("Error: mobileNumber must be exactly 10 digits");
  if (users.has(key)) return res.status(400).type("text/plain").send("Error: Username is already taken!");

  const id = nextUserId++;
  seedUser({ id, username: key, password, email, firstName, lastName, mobileNumber, roles: ["ROLE_USER"] });
  res.status(200).type("text/plain").send("User registered successfully!");
});

// NOTE: the real server currently returns HTTP 500 for this endpoint (confirmed
// from a real test run - a bug on their end). This mock matches that by default.
// Set MOCK_FORGOT_PASSWORD_OK=1 to get the success path (and a working reset flow).
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "Email is required" });

  if (process.env.MOCK_FORGOT_PASSWORD_OK === "1") {
    const user = [...users.values()].find((u) => u.email === email);
    let resetToken;
    if (user) {
      resetToken = crypto.randomBytes(16).toString("hex");
      resetTokens.set(resetToken, user.username);
    }
    return res.status(200).json({
      message: "If the email exists, a reset link has been sent.",
      // exposed here only for mock testability - a real API would email this, not return it
      ...(resetToken ? { mockResetToken: resetToken } : {}),
    });
  }

  res.status(500).json({
    timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
    status: 500,
    error: "System Error",
    message: "An unexpected error occurred",
    path: "uri=/api/auth/forgot-password",
    solution: "Please try again later or contact support",
    errorCode: "SYS_001",
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, newPassword, confirmPassword } = req.body || {};
  if (!token || !resetTokens.has(token)) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "newPassword must be at least 6 characters" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "newPassword and confirmPassword do not match" });
  }
  const username = resetTokens.get(token);
  users.get(username).password = newPassword;
  resetTokens.delete(token);
  res.status(200).json({ message: "Password reset successful" });
});

// =====================================================================
// USER MANAGEMENT
// =====================================================================
app.get("/api/users/profile", requireAuth, (req, res) => {
  res.status(200).json(toProfileResponse(req.user));
});

app.put("/api/users/profile", requireAuth, (req, res) => {
  const { firstName, lastName, email, mobileNumber } = req.body || {};
  if (!firstName || !lastName) {
    return res.status(400).json({ message: "firstName and lastName are required" });
  }
  if (mobileNumber !== undefined && !/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ message: "mobileNumber must be exactly 10 digits" });
  }
  Object.assign(req.user, { firstName, lastName, ...(email !== undefined ? { email } : {}), ...(mobileNumber !== undefined ? { mobileNumber } : {}) });
  res.status(200).json(toProfileResponse(req.user));
});

app.delete("/api/users/profile", requireAuth, (req, res) => {
  const { confirmationCode } = req.query;
  if (!confirmationCode) {
    return res.status(400).json({ message: "confirmationCode is required" });
  }
  for (const [tok, uname] of tokens.entries()) {
    if (uname === req.username) tokens.delete(tok);
  }
  users.delete(req.username);
  usersById.delete(req.user.id);
  res.status(200).json({ message: "Profile deleted successfully" });
});

app.patch("/api/users/profile", requireAuth, (req, res) => {
  const { firstName, lastName, email, mobileNumber, address } = req.body || {};
  if (firstName !== undefined) req.user.firstName = firstName;
  if (lastName !== undefined) req.user.lastName = lastName;
  if (email !== undefined) req.user.email = email;
  if (mobileNumber !== undefined) req.user.mobileNumber = mobileNumber;
  if (address !== undefined) req.user.address = address;
  res.status(200).json({ ...toProfileResponse(req.user), ...(req.user.address ? { address: req.user.address } : {}) });
});

app.put("/api/users/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  if (req.user.password !== currentPassword) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "newPassword must be at least 6 characters" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "newPassword and confirmPassword do not match" });
  }
  req.user.password = newPassword;
  res.status(200).json({ message: "Password changed successfully" });
});

// =====================================================================
// ACCOUNTS
// =====================================================================
app.post("/api/accounts", requireAuth, (req, res) => {
  const { accountType, branch } = req.body || {};
  if (!["SAVINGS", "CURRENT", "SALARY"].includes(accountType)) {
    return res.status(400).json({ message: "accountType must be one of SAVINGS, CURRENT, SALARY" });
  }
  const accountNumber = genAccountNumber();
  const acc = {
    accountNumber,
    ownerUsername: req.username,
    accountType,
    balance: 0,
    status: "ACTIVE",
    branch: branch || "Main Branch",
    createdAt: new Date().toISOString(),
    ownerName: `${req.user.firstName} ${req.user.lastName}`,
  };
  accounts.set(accountNumber, acc);
  res.status(200).json(toAccountResponse(acc));
});

app.get("/api/accounts/user", requireAuth, (req, res) => {
  const list = [...accounts.values()].filter((a) => a.ownerUsername === req.username).map(toAccountResponse);
  res.status(200).json(list);
});

app.get("/api/accounts/:accountNumber", requireAuth, requireAccountOwnerOrAdmin((req) => req.params.accountNumber), (req, res) => {
  res.status(200).json(toAccountResponse(req.account));
});

// =====================================================================
// TRANSACTIONS
// =====================================================================
function recordTxn({ sourceAccount, targetAccount, amount, balanceAfterTransaction, type, description }) {
  const t = {
    id: nextTxnId++,
    transactionReference: genTxnRef(),
    sourceAccount: sourceAccount || null,
    targetAccount: targetAccount || null,
    amount,
    balanceAfterTransaction,
    type,
    status: "SUCCESS",
    description: description || "",
    transactionDate: new Date().toISOString(),
  };
  transactions.push(t);
  return t;
}

app.post("/api/transactions/deposit", requireAuth, requireAccountOwnerOrAdmin((req) => (req.body || {}).accountNumber), (req, res) => {
  const { amount, description } = req.body || {};
  if (!(amount > 0)) return res.status(400).json({ message: "amount must be greater than 0" });
  req.account.balance += amount;
  const t = recordTxn({ sourceAccount: req.account.accountNumber, amount, balanceAfterTransaction: req.account.balance, type: "DEPOSIT", description });
  res.status(200).json(toTxnResponse(t));
});

app.post("/api/transactions/withdraw", requireAuth, requireAccountOwnerOrAdmin((req) => (req.body || {}).accountNumber), (req, res) => {
  const { amount, description } = req.body || {};
  if (!(amount > 0)) return res.status(400).json({ message: "amount must be greater than 0" });
  if (req.account.status !== "ACTIVE") return res.status(400).json({ message: `Account is ${req.account.status}` });
  if (req.account.balance < amount) return res.status(400).json({ message: "Insufficient balance" });
  req.account.balance -= amount;
  const t = recordTxn({ sourceAccount: req.account.accountNumber, amount, balanceAfterTransaction: req.account.balance, type: "WITHDRAWAL", description });
  res.status(200).json(toTxnResponse(t));
});

app.post("/api/transactions/transfer", requireAuth, (req, res) => {
  const { fromAccount, toAccount, amount, description } = req.body || {};
  const from = accounts.get(fromAccount);
  const to = accounts.get(toAccount);
  if (!from || !to) return res.status(404).json({ message: "One or both accounts not found" });
  if (from.ownerUsername !== req.username && !req.user.roles.includes("ROLE_ADMIN")) {
    return res.status(403).json({ message: "You do not have access to the source account" });
  }
  if (!(amount > 0)) return res.status(400).json({ message: "amount must be greater than 0" });
  if (from.status !== "ACTIVE") return res.status(400).json({ message: `Source account is ${from.status}` });
  if (from.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

  from.balance -= amount;
  to.balance += amount;
  const ref = genTxnRef("TRF");
  const outTxn = { id: nextTxnId++, transactionReference: ref, sourceAccount: from.accountNumber, targetAccount: to.accountNumber, amount, balanceAfterTransaction: from.balance, type: "TRANSFER_OUT", status: "SUCCESS", description: description || "", transactionDate: new Date().toISOString() };
  const inTxn = { id: nextTxnId++, transactionReference: ref, sourceAccount: from.accountNumber, targetAccount: to.accountNumber, amount, balanceAfterTransaction: to.balance, type: "TRANSFER_IN", status: "SUCCESS", description: description || "", transactionDate: new Date().toISOString() };
  transactions.push(outTxn, inTxn);
  res.status(200).json(toTxnResponse(outTxn));
});

app.post("/api/transactions/transfer/initiate", requireAuth, (req, res) => {
  const { fromAccount, toAccount, amount, description } = req.body || {};
  const from = accounts.get(fromAccount);
  const to = accounts.get(toAccount);
  if (!from || !to) return res.status(404).json({ message: "One or both accounts not found" });
  if (from.ownerUsername !== req.username && !req.user.roles.includes("ROLE_ADMIN")) {
    return res.status(403).json({ message: "You do not have access to the source account" });
  }
  if (!(amount > 0)) return res.status(400).json({ message: "amount must be greater than 0" });
  if (from.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

  const transactionId = genTxnRef("PEND");
  pendingTransfers.set(transactionId, { fromAccount, toAccount, amount, description, otp: "123456" });
  res.status(200).json({
    transactionId,
    otpRequired: true,
    message: "OTP sent to registered mobile number (mock: use 123456)",
  });
});

app.post("/api/transactions/transfer/complete", requireAuth, (req, res) => {
  const { otp, transactionId } = req.body || {};
  const pending = pendingTransfers.get(transactionId);
  if (!pending) return res.status(404).json({ message: "Transaction not found or already completed" });
  if (otp !== pending.otp) return res.status(400).json({ message: "Invalid OTP" });

  const from = accounts.get(pending.fromAccount);
  const to = accounts.get(pending.toAccount);
  if (from.balance < pending.amount) {
    pendingTransfers.delete(transactionId);
    return res.status(400).json({ message: "Insufficient balance" });
  }
  from.balance -= pending.amount;
  to.balance += pending.amount;
  const ref = genTxnRef("TRF");
  transactions.push(
    { id: nextTxnId++, transactionReference: ref, sourceAccount: from.accountNumber, targetAccount: to.accountNumber, amount: pending.amount, balanceAfterTransaction: from.balance, type: "TRANSFER_OUT", status: "SUCCESS", description: pending.description || "", transactionDate: new Date().toISOString() },
    { id: nextTxnId++, transactionReference: ref, sourceAccount: from.accountNumber, targetAccount: to.accountNumber, amount: pending.amount, balanceAfterTransaction: to.balance, type: "TRANSFER_IN", status: "SUCCESS", description: pending.description || "", transactionDate: new Date().toISOString() }
  );
  pendingTransfers.delete(transactionId);
  res.status(200).json({ message: "Transfer completed successfully", transactionReference: ref });
});

app.get("/api/transactions/history", requireAuth, requireAccountOwnerOrAdmin((req) => req.query.accountNumber), (req, res) => {
  const { page = 0, size = 10 } = req.query;
  const list = transactions.filter((t) => t.sourceAccount === req.account.accountNumber || t.targetAccount === req.account.accountNumber).map(toTxnResponse);
  res.status(200).json(paginate(list, page, size));
});

// =====================================================================
// MOCK UPI
// =====================================================================
const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z][a-zA-Z0-9]+$/;

app.post("/api/upi/verify", requireAuth, (req, res) => {
  const { upiId } = req.body || {};
  if (!upiId || !UPI_REGEX.test(upiId)) {
    return res.status(400).json({ valid: false, message: "Invalid UPI ID format" });
  }
  res.status(200).json({ valid: true, upiId, accountHolderName: "Mock Verified User" });
});

app.post("/api/upi/qr-code/generate", requireAuth, (req, res) => {
  const { merchantVpa, merchantName, amount, transactionNote } = req.body || {};
  if (!merchantVpa || !UPI_REGEX.test(merchantVpa)) return res.status(400).json({ message: "Invalid merchantVpa" });
  if (!merchantName || merchantName.length < 2) return res.status(400).json({ message: "Invalid merchantName" });
  if (!(amount > 0)) return res.status(400).json({ message: "amount must be greater than 0" });

  const qrCodeData = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&tn=${encodeURIComponent(transactionNote || "")}`;
  res.status(200).json({ qrCodeData, merchantVpa, merchantName, amount });
});

app.post("/api/upi/payment/initiate", requireAuth, (req, res) => {
  const { fromUpi, toUpi, amount, note } = req.body || {};
  if (!fromUpi || !UPI_REGEX.test(fromUpi)) return res.status(400).json({ message: "Invalid fromUpi" });
  if (!toUpi || !UPI_REGEX.test(toUpi)) return res.status(400).json({ message: "Invalid toUpi" });
  if (!(amount > 0)) return res.status(400).json({ message: "amount must be greater than 0" });

  const transactionRef = genTxnRef("UPI");
  const record = { transactionRef, status: "SUCCESS", fromUpi, toUpi, amount, note: note || "" };
  upiPayments.set(transactionRef, record);
  res.status(200).json(record);
});

app.get("/api/upi/payment/status/:transactionRef", requireAuth, (req, res) => {
  const record = upiPayments.get(req.params.transactionRef);
  if (!record) return res.status(404).json({ message: "Transaction not found" });
  res.status(200).json(record);
});

// =====================================================================
// KYC
// =====================================================================
app.post("/api/kyc/upload", requireAuth, (req, res) => {
  const { documentType, documentNumber } = req.query;
  if (!documentType || !documentNumber) {
    return res.status(400).json({ message: "documentType and documentNumber query params are required" });
  }
  const record = { status: "PENDING", documentType, documentNumber, uploadedAt: new Date().toISOString() };
  kycRecords.set(req.username, record);
  res.status(200).json({ ...record, message: "Document uploaded successfully, verification pending" });
});

app.get("/api/kyc/status", requireAuth, (req, res) => {
  res.status(200).json(kycRecords.get(req.username) || { status: "NOT_SUBMITTED" });
});

// =====================================================================
// ADMIN
// =====================================================================
app.get("/api/admin/users", requireAuth, requireAdmin, (req, res) => {
  const { page = 0, size = 10 } = req.query;
  const list = [...users.values()].map(toProfileResponse);
  res.status(200).json(paginate(list, page, size));
});

app.get("/api/admin/users/:userId", requireAuth, requireAdmin, (req, res) => {
  const uname = usersById.get(Number(req.params.userId));
  if (!uname) return res.status(404).json({ message: "User not found" });
  res.status(200).json(toProfileResponse(users.get(uname)));
});

app.put("/api/admin/users/:userId/deactivate", requireAuth, requireAdmin, (req, res) => {
  const uname = usersById.get(Number(req.params.userId));
  if (!uname) return res.status(404).json({ message: "User not found" });
  users.get(uname).active = false;
  res.status(200).json({ message: "User deactivated" });
});

app.put("/api/admin/users/:userId/activate", requireAuth, requireAdmin, (req, res) => {
  const uname = usersById.get(Number(req.params.userId));
  if (!uname) return res.status(404).json({ message: "User not found" });
  users.get(uname).active = true;
  res.status(200).json({ message: "User activated" });
});

app.get("/api/admin/transactions", requireAuth, requireAdmin, (req, res) => {
  const { page = 0, size = 10 } = req.query;
  res.status(200).json(paginate(transactions.map(toTxnResponse), page, size));
});

app.get("/api/admin/accounts", requireAuth, requireAdmin, (req, res) => {
  const { page = 0, size = 10 } = req.query;
  res.status(200).json(paginate([...accounts.values()].map(toAccountResponse), page, size));
});

app.put("/api/admin/accounts/:accountNumber/freeze", requireAuth, requireAdmin, (req, res) => {
  const acc = accounts.get(req.params.accountNumber);
  if (!acc) return res.status(404).json({ message: "Account not found" });
  acc.status = "FROZEN";
  res.status(200).json({ message: "Account frozen", reason: req.query.reason || "" });
});

app.put("/api/admin/accounts/:accountNumber/unfreeze", requireAuth, requireAdmin, (req, res) => {
  const acc = accounts.get(req.params.accountNumber);
  if (!acc) return res.status(404).json({ message: "Account not found" });
  acc.status = "ACTIVE";
  res.status(200).json({ message: "Account unfrozen", reason: req.query.reason || "" });
});

// =====================================================================
// REPORTS (real PDF / Excel files)
// =====================================================================
app.get("/api/reports/statement/pdf", requireAuth, requireAccountOwnerOrAdmin((req) => req.query.accountNumber), (req, res) => {
  const { fromDate, toDate } = req.query;
  const acc = req.account;
  const list = transactions.filter((t) => t.sourceAccount === acc.accountNumber || t.targetAccount === acc.accountNumber);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="statement-${acc.accountNumber}.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(18).text("Account Statement", { align: "center" });
  doc.moveDown();
  doc.fontSize(11).text(`Account Number: ${acc.accountNumber}`);
  doc.text(`Owner: ${acc.ownerName}`);
  doc.text(`Balance: ${acc.balance}`);
  if (fromDate || toDate) doc.text(`Period: ${fromDate || "-"} to ${toDate || "-"}`);
  doc.moveDown();
  doc.fontSize(13).text("Transactions", { underline: true });
  doc.moveDown(0.5);
  if (list.length === 0) {
    doc.fontSize(11).text("No transactions found.");
  } else {
    list.forEach((t) => {
      doc.fontSize(10).text(`${t.transactionDate}  |  ${t.type}  |  Amount: ${t.amount}  |  Balance after: ${t.balanceAfterTransaction}  |  ${t.description || ""}`);
    });
  }
  doc.end();
});

app.get("/api/reports/statement/excel", requireAuth, requireAccountOwnerOrAdmin((req) => req.query.accountNumber), async (req, res) => {
  const acc = req.account;
  const list = transactions.filter((t) => t.sourceAccount === acc.accountNumber || t.targetAccount === acc.accountNumber);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Statement");
  sheet.addRow(["Account Number", acc.accountNumber]);
  sheet.addRow(["Owner", acc.ownerName]);
  sheet.addRow(["Balance", acc.balance]);
  sheet.addRow([]);
  sheet.addRow(["Date", "Type", "Amount", "Balance After", "Description"]).font = { bold: true };
  list.forEach((t) => {
    sheet.addRow([t.transactionDate, t.type, t.amount, t.balanceAfterTransaction, t.description || ""]);
  });
  sheet.columns.forEach((col) => (col.width = 22));

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="statement-${acc.accountNumber}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

// =====================================================================
app.get("/", (req, res) => {
  res.send("Mock Banking API is running.");
});

app.listen(PORT, () => {
  console.log(`Mock API replica listening on http://localhost:${PORT}`);
  console.log(`Swagger UI -> http://localhost:${PORT}/swagger-ui/  (do NOT add index.html to the URL)`);
  console.log(`Seeded user -> username: kshipra, password: Kshipra123 (account AC100000001, balance 50000)`);
  console.log(`Seeded admin -> username: admin, password: Admin123`);
});
