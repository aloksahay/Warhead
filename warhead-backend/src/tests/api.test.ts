import { expect } from 'chai';
import request from 'supertest';
import { app } from '../server';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Skip Supabase tests if credentials are not available
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const hasSupabaseCredentials = SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project') && 
  !SUPABASE_ANON_KEY.includes('your-anon-key');

const supabase = hasSupabaseCredentials ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

describe('API Security Tests', () => {
  it('should return 429 when rate limit is exceeded', async () => {
    // Make 11 requests in quick succession to trigger rate limit
    const requests = Array(11).fill(null);
    for (let i = 0; i < requests.length; i++) {
      const response = await request(app).get('/api/health');
      if (i < 10) {
        expect(response.status).to.equal(200);
      } else {
        expect(response.status).to.equal(429);
        expect(response.body).to.have.property('error').that.includes('Too many requests');
      }
    }
  });

  it('should have security headers', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers).to.have.property('x-frame-options');
    expect(response.headers).to.have.property('x-content-type-options');
    expect(response.headers).to.have.property('strict-transport-security');
  });
});

// Skip game functionality tests until we have valid Supabase credentials
describe.skip('Game Functionality Tests', () => {
  let testUserId: string;
  let testAuthToken: string;

  before(async function() {
    if (!supabase) {
      this.skip();
      return;
    }

    // Create a test user and get auth token
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: `test${Date.now()}@example.com`,
      password: 'testPassword123!'
    });

    if (signUpError || !authData.user) throw new Error('Failed to create test user');
    testUserId = authData.user.id;
    
    // Get session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error('Failed to get session');
    testAuthToken = session.access_token;
  });

  after(async function() {
    if (!supabase || !testUserId) {
      return;
    }

    // Cleanup test user
    const { error } = await supabase.auth.admin.deleteUser(testUserId);
    if (error) console.error('Failed to delete test user:', error);
  });

  it('should create a new wallet for a user', async () => {
    const response = await request(app)
      .post('/api/wallet/create')
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send();

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('address');
  });

  it('should list available missiles', async () => {
    const response = await request(app)
      .get('/api/missiles')
      .set('Authorization', `Bearer ${testAuthToken}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.be.an('array');
  });

  it('should handle missile purchase', async () => {
    const response = await request(app)
      .post('/api/missiles/purchase')
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({
        missileId: 1,
        quantity: 1
      });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('transactionHash');
  });

  it('should send missile to target', async () => {
    const response = await request(app)
      .post('/api/missiles/send')
      .set('Authorization', `Bearer ${testAuthToken}`)
      .send({
        targetAddress: '0x1234567890123456789012345678901234567890',
        missileId: 1
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('success', true);
  });
}); 