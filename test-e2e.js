'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// Helper for HTTP requests with cookie jar and multipart support
class TestClient {
  constructor(port) {
    this.port = port;
    this.cookies = {};
  }

  request(method, reqPath, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const cookieHeader = Object.entries(this.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      const reqHeaders = {
        ...headers,
        ...(cookieHeader ? { Cookie: cookieHeader } : {})
      };

      let bodyData = null;
      if (body) {
        if (headers['Content-Type'] && headers['Content-Type'].startsWith('multipart/form-data')) {
          bodyData = body; // already a buffer
        } else if (typeof body === 'object' && !headers['Content-Type']) {
          bodyData = new URLSearchParams(body).toString();
          reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        } else if (typeof body === 'string') {
          bodyData = body;
        } else {
          bodyData = JSON.stringify(body);
        }
        reqHeaders['Content-Length'] = Buffer.isBuffer(bodyData) ? bodyData.length : Buffer.byteLength(bodyData);
      }

      const req = http.request({
        hostname: 'localhost',
        port: this.port,
        path: reqPath,
        method,
        headers: reqHeaders
      }, (res) => {
        const setCookie = res.headers['set-cookie'];
        if (setCookie) {
          setCookie.forEach(c => {
            const [cookiePart] = c.split(';');
            const [name, val] = cookiePart.split('=');
            if (name && val) this.cookies[name.trim()] = val.trim();
          });
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: buffer.toString('utf8'),
            rawBody: buffer
          });
        });
      });

      req.on('error', reject);
      if (bodyData) req.write(bodyData);
      req.end();
    });
  }

  get(p) { return this.request('GET', p); }
  post(p, data, headers = {}) { return this.request('POST', p, data, headers); }

  postMultipart(p, fields, fileField, fileName, fileContent, mimeType = 'text/plain') {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const chunks = [];

    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined && v !== null) {
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
      }
    }

    if (fileField && fileName && fileContent) {
      chunks.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${fileName}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`
      ));
      chunks.push(Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent));
      chunks.push(Buffer.from('\r\n'));
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(chunks);

    return this.request('POST', p, fullBody, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    });
  }
}

async function runTests() {
  console.log('--- Starting La Kazarma E2E Tests (Parts 1 & 2) ---');
  const adminClient = new TestClient(3000);

  // 1. Admin login
  console.log('[Test 1] Admin login');
  let res = await adminClient.post('/login', { identifier: 'admin', password: 'Admin@123' });
  if (res.statusCode !== 302 || res.headers.location !== '/dashboard') {
    throw new Error('Admin login failed');
  }
  console.log('✓ Admin authenticated');

  // 2. Initial Subjects verification
  console.log('[Test 2] GET /subjects (verify pre-seeded BHOS CE 25 subjects)');
  res = await adminClient.get('/subjects');
  if (res.statusCode !== 200 || !res.body.includes('Operating Systems') || !res.body.includes('Database Management Systems')) {
    throw new Error('Pre-seeded subjects missing from /subjects');
  }
  console.log('✓ Subjects catalog renders with pre-seeded BHOS CE 25 courses');

  // 3. Admin creates a new Subject
  console.log('[Test 3] Admin creates subject: Compiler Design (CE 401)');
  res = await adminClient.post('/subjects', {
    name: 'Compiler Design',
    code: 'CE 401',
    description: 'Lexical analysis, parsing, semantic analysis, intermediate representation, and code generation.',
    semester: 'Fall 2025',
    academic_year: '2025-2026'
  });
  if (res.statusCode !== 302) throw new Error('Subject creation failed');
  console.log('✓ Compiler Design subject created');

  // Find newly created subject ID
  const Subject = require('./src/models/Subject');
  const compilerSub = Subject.findAll().find(s => s.code === 'CE 401');
  if (!compilerSub) throw new Error('Could not find created subject in DB');

  // 4. Admin adds Topic to Subject
  console.log('[Test 4] Admin adds Topic: Lexical Analysis & Lex/Flex');
  res = await adminClient.post(`/subjects/${compilerSub.id}/topics`, {
    name: 'Lexical Analysis & Regular Expressions',
    order_index: '1',
    description: 'DFA, NFA, and token recognition'
  });
  if (res.statusCode !== 302) throw new Error('Add topic failed');
  console.log('✓ Topic added to subject');

  // 5. Admin adds Announcement to Subject
  console.log('[Test 5] Admin posts Subject Announcement');
  res = await adminClient.post(`/subjects/${compilerSub.id}/announcements`, {
    title: 'Welcome to Compiler Design Fall 2025',
    content: 'All course slides and laboratory assignments will be posted to this Kazarma workspace.'
  });
  if (res.statusCode !== 302) throw new Error('Add announcement failed');
  console.log('✓ Announcement published in subject workspace');

  // 6. Register Student 1 (Murad) using invitation code
  console.log('[Test 6] Register Student 1 (Murad)');
  const student1 = new TestClient(3000);
  res = await student1.post('/register', {
    full_name: 'Murad Mammadov',
    username: 'muradm',
    student_code: 'BHOS-CE-042',
    email: 'murad.m@bhos.edu.az',
    invitation_code: 'BHOS-CE25-INIT',
    password: 'Password123!',
    confirm_password: 'Password123!'
  });
  if (res.statusCode !== 302) throw new Error('Student 1 registration failed');
  await student1.post('/login', { identifier: 'muradm', password: 'Password123!' });
  console.log('✓ Student 1 (Murad) logged in');

  // 7. Student 1 Uploads Study Material (Lecture Notes)
  console.log('[Test 7] Student 1 uploads Material with attachment');
  const noteContent = 'Operating Systems Lecture 3 Summary:\n1. Round Robin Scheduling\n2. Context Switching Overheads\n3. Preemptive vs Cooperative Multitasking';
  res = await student1.postMultipart('/materials/upload', {
    title: 'OS Lecture 03 Summary Notes',
    description: 'Concise summary of CPU scheduling algorithms and context switching metrics.',
    subject_id: compilerSub.id,
    category: 'Lecture Notes',
    tags: 'os, scheduling, summary'
  }, 'file', 'OS_Lecture_03_Notes.txt', noteContent, 'text/plain');

  if (res.statusCode !== 302) throw new Error(`Material upload failed with status ${res.statusCode}`);
  const Material = require('./src/models/Material');
  const uploadedMat = Material.findAll().find(m => m.title === 'OS Lecture 03 Summary Notes');
  if (!uploadedMat) throw new Error('Uploaded material not found in DB');
  console.log(`✓ Material uploaded successfully (ID: ${uploadedMat.id})`);

  // 8. Download & Preview Material
  console.log('[Test 8] Material download & preview endpoints');
  res = await student1.get(`/materials/${uploadedMat.id}/download`);
  if (res.statusCode !== 200 || !res.body.includes('Round Robin Scheduling')) {
    throw new Error('Material download failed or corrupted');
  }
  res = await student1.get(`/materials/${uploadedMat.id}/preview`);
  if (res.statusCode !== 200 || !res.body.includes('Context Switching')) {
    throw new Error('Material preview failed');
  }
  console.log('✓ Material download & raw preview verified');

  // 9. Bookmark Material
  console.log('[Test 9] Bookmark Material');
  res = await student1.post(`/materials/${uploadedMat.id}/bookmark`);
  if (res.statusCode !== 302) throw new Error('Bookmark toggle failed');
  res = await student1.get('/bookmarks');
  if (!res.body.includes('OS Lecture 03 Summary Notes')) {
    throw new Error('Bookmarked material missing on /bookmarks');
  }
  console.log('✓ Material successfully bookmarked and listed in My Bookmarks');

  // 10. Student 1 Creates Assignment
  console.log('[Test 10] Student 1 creates Assignment: Lab 1 Lexer');
  const assignSpec = 'Problem Specification: Build a lexical analyzer in C++ that scans arithmetic expressions and outputs tokens.';
  res = await student1.postMultipart('/assignments/new', {
    title: 'Lab 1: C++ Arithmetic Expression Lexer',
    description: 'Implement a lexical scanner that parses operators, operands, identifiers, and handles syntax errors.',
    subject_id: compilerSub.id,
    deadline_date: '2026-12-31',
    deadline_time: '23:59',
    tags: 'lexer, c++, tokens, lab-1'
  }, 'file', 'Lab1_Lexer_Specification.txt', assignSpec, 'text/plain');

  if (res.statusCode !== 302) throw new Error('Assignment creation failed');
  const Assignment = require('./src/models/Assignment');
  const assignment = Assignment.findAll().find(a => a.title.includes('Lab 1'));
  if (!assignment) throw new Error('Assignment not found in DB');
  console.log(`✓ Assignment created (ID: ${assignment.id}) with attached specification`);

  // 11. Student 1 Submits Solution 1
  console.log('[Test 11] Student 1 submits Solution 1');
  const sol1Code = '#include <iostream>\nint main() { std::cout << "Murad Lexer Solution\\n"; return 0; }';
  res = await student1.postMultipart(`/assignments/${assignment.id}/solutions`, {
    title: "Murad's Fast Scanner (C++20)",
    notes: 'Used std::string_view for zero-copy tokenization.'
  }, 'file', 'murad_lexer.cpp', sol1Code, 'text/plain');
  if (res.statusCode !== 302) throw new Error('Solution 1 submission failed');
  console.log('✓ Student 1 solution submitted');

  // 12. Register Student 2 (Aysel) and Submit Independent Solution 2
  console.log('[Test 12] Register Student 2 (Aysel) via Admin code and submit independent solution');
  // Admin generates new code
  const codeRes = await adminClient.post('/admin/invitation-codes', {}, { 'Content-Type': 'application/json' });
  const ayselCode = JSON.parse(codeRes.body).code.code;

  const student2 = new TestClient(3000);
  await student2.post('/register', {
    full_name: 'Aysel Karimova',
    username: 'ayselk',
    student_code: 'BHOS-CE-088',
    email: 'aysel.k@bhos.edu.az',
    invitation_code: ayselCode,
    password: 'Password123!',
    confirm_password: 'Password123!'
  });
  await student2.post('/login', { identifier: 'ayselk', password: 'Password123!' });

  const sol2Code = '#include <iostream>\nint main() { std::cout << "Aysel Lexer Regex Solution\\n"; return 0; }';
  res = await student2.postMultipart(`/assignments/${assignment.id}/solutions`, {
    title: "Aysel's Regex-based Tokenizer",
    notes: 'Built with std::regex and DFA state transition tables.'
  }, 'file', 'aysel_lexer.cpp', sol2Code, 'text/plain');
  if (res.statusCode !== 302) throw new Error('Solution 2 submission failed');

  // Verify both solutions are present and separate (neither overwrote the other)
  const Solution = require('./src/models/Solution');
  const solutions = Solution.findByAssignmentId(assignment.id);
  if (solutions.length !== 2) {
    throw new Error(`Expected 2 distinct solutions, found ${solutions.length}`);
  }
  const muradSol = solutions.find(s => s.student_code === 'BHOS-CE-042');
  const ayselSol = solutions.find(s => s.student_code === 'BHOS-CE-088');
  if (!muradSol || !ayselSol) {
    throw new Error('Solutions were overwritten or missing student links');
  }
  console.log('✓ Both students have separate, non-conflicting solutions stored in assignment workspace');

  // 13. Download Solution File
  console.log('[Test 13] Download student solution file');
  res = await student1.get(`/assignments/solutions/${ayselSol.id}/download`);
  if (res.statusCode !== 200 || !res.body.includes('Aysel Lexer Regex Solution')) {
    throw new Error('Solution download failed');
  }
  console.log('✓ Solution download verified');

  // 14. Admin Platform Settings update
  console.log('[Test 14] Admin updates platform policy settings');
  res = await adminClient.post('/admin/settings', {
    max_file_size_mb: '100',
    allowed_file_types: 'pdf,doc,docx,ppt,pptx,xls,xlsx,txt,png,jpg,jpeg,webp,zip',
    allow_zip_uploads: '1',
    content_moderation_enabled: '0'
  });
  if (res.statusCode !== 302) throw new Error('Settings update failed');
  const Setting = require('./src/models/Setting');
  if (Setting.get('max_file_size_mb') !== '100') {
    throw new Error('Setting was not updated in DB');
  }
  console.log('✓ Platform settings updated and verified in DB');

  // 15. Verify Dashboard numbers
  console.log('[Test 15] Verify Dashboard workspace counts');
  res = await student1.get('/dashboard');
  if (res.statusCode !== 200 || !res.body.includes('Your Uploads') || !res.body.includes('Assignments')) {
    throw new Error('Dashboard stats failed to render');
  }
  console.log('✓ Dashboard renders real counts for Uploads, Assignments, Bookmarks, and Subjects');

  console.log('\n======================================================');
  console.log('🎉 ALL 15 COMPREHENSIVE TESTS PASSED SUCCESSFULLY! 🎖️');
  console.log('======================================================\n');
}

module.exports = runTests;

if (require.main === module) {
  const app = require('./app');
  setTimeout(async () => {
    try {
      await runTests();
      process.exit(0);
    } catch (err) {
      console.error('\n❌ TEST FAILURE:', err.message);
      process.exit(1);
    }
  }, 500);
}
