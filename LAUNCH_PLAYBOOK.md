# SnapMod Launch Playbook - Your Path to $1K MRR

## 🎯 Executive Summary

**Current Status**: Feature-complete MVP with monetization foundation
**Target**: 100 users in 30 days → $1K MRR in 90 days
**Strategy**: Reddit validation → Twitter growth → ProductHunt launch

---

## 📊 What You Just Built (In This Session)

### Technical Infrastructure
✅ **System Prompt Architecture**
- Comprehensive editing guidelines for AI
- Prevents image regeneration
- Interprets common editing terms (cinematic, golden hour, etc.)

✅ **Analytics System**
- Privacy-first event tracking
- Local storage with opt-out
- Tracks: uploads, edits, shares, failures
- Foundation for A/B testing

✅ **Usage Limits & Monetization**
- 5 free edits/day
- Pro tier: $4.99/month unlimited
- Upgrade modal with feature comparison
- Usage counter in UI

✅ **UX Enhancements**
- 10 preset prompts with icons
- Native share functionality
- Floating share button
- Better onboarding for new users

✅ **API Protection**
- Rate limiting (20 req/min)
- IP-based tracking
- Cost protection against abuse

✅ **Mobile Optimizations**
- iOS safe area support
- Desktop image display fixes
- Touch-optimized UI

---

## 📈 Business Model Breakdown

### Pricing Strategy

**Free Tier**:
- 5 edits per day
- All features unlocked
- Watermark optional (to be decided)
- **Goal**: Viral growth through sharing

**Pro Tier - $4.99/month**:
- Unlimited edits
- No watermarks
- Higher quality AI models (future)
- Batch processing (future)
- Priority support

**Why $4.99?**:
- Below "decision fatigue" threshold ($5-10 range)
- Impulse purchase territory
- Higher than generic subscriptions ($0.99-2.99)
- Room for annual discount ($49/year = 17% off)

### Revenue Projections

**Conservative** (6 months):
- 2,000 total users
- 5% conversion to paid (100 users)
- $499/month MRR
- **Profitable if AI costs < $200/month**

**Realistic** (3 months):
- 5,000 total users
- 3% conversion (150 users)
- $749/month MRR
- **Covers costs + ramen profitability**

**Optimistic** (2 months):
- 10,000 total users (viral growth)
- 5% conversion (500 users)
- $2,495/month MRR
- **Quit your job territory**

### Unit Economics

**Per User Cost**:
- AI (Gemini 2.5 Flash Image): ~$0.002/edit
- Free user (5 edits): $0.01/day = $0.30/month
- Pro user (30 edits/day avg): $1.80/month
- **Gross Margin**: 64% ($4.99 - $1.80 = $3.19)

**Break-Even Point**:
- Fixed costs: ~$50/month (Vercel Pro, domain, tools)
- Need: 10 paying users to break even
- After that: pure profit (64% margin)

---

## 🚀 30-Day Launch Plan

### Week 1: Validation (Days 1-7)

**Day 1-2: System Prompt Testing**
- [ ] Test with 20 real photos (see TESTING_GUIDE.md)
- [ ] Score composition preservation (target: 80%)
- [ ] Document failures and iterate
- [ ] If below 70%, consider model switch

**Day 3-4: Friend & Family Beta**
- [ ] Share with 10 people (not tech-savvy)
- [ ] Watch them use it (Loom screen record)
- [ ] Ask: "What's confusing? What breaks?"
- [ ] Fix 2-3 critical UX issues

**Day 5-6: Analytics Validation**
- [ ] Verify all events fire correctly
- [ ] Test usage limits end-to-end
- [ ] Confirm upgrade modal works
- [ ] Test share functionality

**Day 7: Decision Point**
- [ ] System prompts work? (Yes = continue, No = pivot)
- [ ] Critical bugs fixed?
- [ ] Ready for public?

---

### Week 2: First 100 Users (Days 8-14)

**Day 8: Reddit Soft Launch**

Post in r/SideProject (timing: Tuesday 10am EST):

```
Title: I built an AI photo editor where you just type what you want

I spent the last month building SnapMod - tired of Lightroom's 47 sliders.

Now you just say "make it cinematic" or "golden hour" and AI does it.

Before/after examples: [imgur album]

Try it: https://snapmod.app (PWA - install on phone)

Looking for brutal feedback. What breaks? What's confusing?

Tech: Next.js 16, OpenRouter (Gemini 2.5 Flash), Edge runtime
```

**Expected**: 50-100 visitors, 10-20 users, 5-10 comments

**Day 9-10: Monitor & Respond**
- [ ] Reply to every comment within 1 hour
- [ ] Fix bugs as reported
- [ ] Document feature requests

**Day 11: Twitter Launch**

Post thread (see TESTING_GUIDE.md for template):
- Tag @OpenRouterAI
- Include demo GIF
- Share tech details for builders
- End with "Try it free" CTA

**Day 12-14: Engage & Iterate**
- [ ] Reply to all mentions
- [ ] Post daily before/after examples
- [ ] Build in public (share metrics, learnings)

**Goal**: 100 total users by end of Week 2

---

### Week 3: Growth & Refinement (Days 15-21)

**Day 15: Analyze Data**

Check analytics:
```javascript
// In browser console
const summary = JSON.parse(localStorage.getItem('analytics_events'))
const eventCounts = {}
summary.forEach(e => {
  eventCounts[e.event] = (eventCounts[e.event] || 0) + 1
})
console.log(eventCounts)
```

**Key Metrics**:
- Upload → Edit conversion: Target 50%+
- Edit → Share conversion: Target 10%+
- Repeat edit rate: Target 30%+

**Day 16-18: Feature Polish**

Based on feedback, prioritize ONE of:
- [ ] Add batch processing (if requested 5+ times)
- [ ] Improve mobile onboarding
- [ ] Add more preset prompts
- [ ] Optimize AI response time

**Day 19-21: Content Marketing**

Create 3 pieces of content:
1. Twitter thread: "I analyzed 1,000 AI photo edits. Here's what works..."
2. Blog post: "How to prevent AI from regenerating your photos"
3. Demo video (90 seconds - see TESTING_GUIDE.md)

**Goal**: 200-300 total users, 1-2 paying customers

---

### Week 4: ProductHunt Launch (Days 22-30)

**Day 22-25: Prepare ProductHunt**

- [ ] Create product listing
- [ ] Upload demo video
- [ ] Write first comment (tech explanation)
- [ ] Recruit 10 friends for upvotes
- [ ] Prepare "ProductHunt Special" ($19 lifetime pro)

**Day 26: LAUNCH DAY (Tuesday or Thursday)**

**Timeline**:
- 12:01am PST: Product goes live
- 6am PST: First friend upvotes
- 8am PST: Post on Twitter/LinkedIn
- 10am PST: Engage in comments
- 2pm PST: Share milestone updates
- 6pm PST: Thank everyone

**Goal**: Top 10 product of the day

**Day 27-30: Post-Launch**

- [ ] Email all signups thanking them
- [ ] Fix critical bugs (priority)
- [ ] Convert PH traffic to users
- [ ] Analyze conversion funnel

**Goal**: 500-1,000 new users from PH

---

## 🎯 Critical Success Factors

### 1. System Prompts MUST Work

**If composition preservation < 70%**:

Switch to better model:
```typescript
// In app/api/nano-banana/route.ts
const requestBody = {
  model: 'anthropic/claude-3.5-sonnet', // Better than Gemini
  messages: messages
};
```

Cost impact: $0.008/edit (4x Gemini) but worth it if quality improves

### 2. Share Functionality MUST Be Frictionless

Test on both platforms:
- iPhone: Native share sheet should show
- Desktop: Copy link should work

If broken, this kills your viral loop.

### 3. Upgrade Modal MUST Convert

Current conversion funnel:
1. Hit limit (5 edits)
2. See upgrade modal
3. Click "Upgrade to Pro"
4. ??? (Stripe not integrated yet)

**Action**: Integrate Stripe within Week 2
```bash
npm install stripe @stripe/stripe-js
```

### 4. First 10 Minutes = Make or Break

Track "time to first successful edit":
- Upload photo: < 5 seconds
- Apply preset: < 2 seconds
- AI processing: < 10 seconds
- Total: < 20 seconds

If longer, users bounce.

---

## 💰 Monetization Milestones

### Milestone 1: First Dollar (Week 2-3)
**Goal**: 1 paying customer
**Strategy**: Personal outreach to power users
**Message**: "Hey! Noticed you've edited 15 photos. Want unlimited for $4.99/month?"

### Milestone 2: $100 MRR (Week 4-6)
**Goal**: 20 paying customers
**Strategy**: In-app upgrade prompts at limit
**Optimization**: Test price points ($2.99, $4.99, $9.99)

### Milestone 3: $500 MRR (Month 2-3)
**Goal**: 100 paying customers
**Strategy**: Viral growth + ProductHunt traffic
**Focus**: Improve retention (reduce churn)

### Milestone 4: $1K MRR (Month 3-4)
**Goal**: 200 paying customers
**Strategy**: Paid ads (if profitable) or double down on organic
**Decision point**: Hire first contractor or stay solo

---

## 📊 Key Metrics to Track

### Daily (Check Every Morning)

```javascript
// Analytics summary
const summary = getAnalyticsSummary()

// Key metrics:
- New users (from analytics_events → first image_uploaded)
- Edit completion rate (edit_completed / edit_started)
- Share rate (share_attempted / edit_completed)
- Error rate (edit_failed / edit_started)
```

### Weekly (Every Monday)

- Total users (cumulative)
- Weekly Active Users (WAU)
- Paying customers
- MRR
- Churn rate
- Average edits per user

### Monthly (First of Month)

- User growth rate
- Revenue growth rate
- Cost per acquisition (if running ads)
- Customer Lifetime Value (LTV)
- Burn rate (costs vs revenue)

---

## 🐛 Common Failure Modes & Fixes

### Problem 1: No One Signs Up

**Symptoms**: < 10 users after Week 1
**Diagnosis**: Value prop unclear OR target audience wrong
**Fix**:
- Rewrite landing copy (focus on pain point)
- Target different subreddit (r/photography vs r/SideProject)
- Add demo video to homepage

### Problem 2: Users Try Once, Never Return

**Symptoms**: 100 users, 5 WAU
**Diagnosis**: Product doesn't deliver value OR UX too complex
**Fix**:
- Interview 5 users: "Why didn't you come back?"
- Simplify onboarding (show presets immediately)
- Add email capture for re-engagement

### Problem 3: Users Love It, But Won't Pay

**Symptoms**: 500 users, 0 paid
**Diagnosis**: Free tier too generous OR price too high
**Fix**:
- Reduce free edits (5 → 3 per day)
- Add watermark to free tier
- Test lower price point ($2.99)

### Problem 4: High Churn Rate

**Symptoms**: 20 paid users, 10 cancel next month
**Diagnosis**: Product doesn't have sustained value
**Fix**:
- Add batch processing (higher value)
- Build email drip campaign with tips
- Survey churned users: "Why did you cancel?"

---

## 🎬 Next 24 Hours: Your Action Plan

### IMMEDIATE (Today)

1. **Test System Prompts**
   - Find 5 photos (portrait, landscape, food, product, indoor)
   - Test each with 3 prompts
   - Score composition preservation
   - Report back results

2. **Verify Analytics**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Upload image → Check console
   # Edit image → Check console
   # Share → Check console
   ```

3. **Test Usage Limits**
   ```javascript
   // In browser console
   localStorage.clear()
   // Do 5 edits → Should trigger upgrade modal
   ```

### Tomorrow

4. **Share With 5 Friends**
   - Send them the local URL
   - Watch them use it (Loom record)
   - Note: What confused them?

5. **Fix Top 3 Issues**
   - Based on friend feedback
   - Prioritize: Anything that blocks editing

### Day 3

6. **Deploy to Production**
   ```bash
   # If using Vercel:
   vercel --prod

   # If not set up yet:
   vercel login
   vercel
   ```

7. **Soft Launch on Reddit**
   - See template in Week 2 plan above
   - Post in r/SideProject
   - Monitor for 48 hours

---

## 🚨 Decision Trees

### Should I Switch AI Models?

**If System Prompts Work (80%+ success)**:
→ Stay with Gemini 2.5 Flash Image ($0.002/edit)

**If System Prompts Fail (< 70% success)**:
→ Test Claude 3.5 Sonnet ($0.008/edit) for 100 edits
→ Compare quality vs cost
→ Switch if quality improvement > 4x better

### Should I Add Features or Focus on Growth?

**If Users < 100**:
→ Focus on growth (Reddit, Twitter, content)
→ No new features until 100 users

**If Users > 100 but low retention**:
→ Focus on features requested 5+ times
→ Fix UX friction points

**If Users > 100 and good retention**:
→ Double down on growth
→ Prepare ProductHunt launch

### Should I Charge More or Less?

**If Conversion < 2%**:
→ Test $2.99/month (lower barrier)

**If Conversion 2-5%**:
→ Keep $4.99/month (sweet spot)

**If Conversion > 5%**:
→ Test $9.99/month (leave money on table?)

---

## 📞 Support & Next Steps

**Your Immediate Priority**:
1. Test system prompts with real photos
2. Report results back to me
3. Launch on Reddit within 3 days

**When to Reach Out**:
- System prompts fail → I'll help you switch models
- Stuck on monetization → I'll help with Stripe integration
- Need launch strategy → I'll review your copy

**Your Goal**:
- Week 1: Validate system prompts work
- Week 2: Get 100 users from Reddit/Twitter
- Week 3: Polish based on feedback
- Week 4: Launch on ProductHunt

---

## 🎯 The Big Picture

**What You're Building**:
Not just a photo editor. You're building:
- **A new UI paradigm**: Natural language vs sliders
- **A mobile-first experience**: PWA = no app store
- **A viral growth engine**: Sharing = free marketing

**Why This Can Win**:
- Photoshop/Lightroom: Too complex, too expensive
- Instagram filters: Limited, no customization
- Other AI editors: Too slow, require accounts

**SnapMod's Advantage**:
- Fast: < 10 seconds per edit
- Frictionless: No signup required
- Understandable: Just type what you want

**The Vision**:
By 2026, "SnapMod it" becomes a verb. Like "Photoshop it" but for mobile-first creators.

---

**Ready to launch? The world is waiting for SnapMod.** 🚀

*P.S. - Remember: Perfect is the enemy of shipped. Your MVP is feature-complete. Now go get users.*
