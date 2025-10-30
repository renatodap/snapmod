# SnapMod Testing & Launch Guide

## 🎯 IMMEDIATE: Test System Prompts (TODAY)

### Test Suite - System Prompt Validation

Run these tests with **real photos** to validate the new system prompt architecture:

#### Test 1: Portrait Photos
**Image**: Person outdoors headshot
**Prompts to test**:
1. "make it cinematic"
2. "golden hour lighting"
3. "professional headshot style"
4. "black and white film look"

**Success Criteria**: Face position unchanged, same person, composition preserved

---

#### Test 2: Landscape Photos
**Image**: Mountain/nature scene
**Prompts to test**:
1. "sunset colors"
2. "vibrant HDR look"
3. "moody storm clouds"
4. "winter blue hour"

**Success Criteria**: Horizon line unchanged, no new objects added, only color/lighting affected

---

#### Test 3: Food Photography
**Image**: Plate of food
**Prompts to test**:
1. "restaurant lighting"
2. "vibrant colors"
3. "magazine editorial style"
4. "moody dark background"

**Success Criteria**: Food items unchanged, only lighting/background modified

---

#### Test 4: Product Photography
**Image**: Product on table (watch, phone, etc.)
**Prompts to test**:
1. "clean white background"
2. "dramatic shadows"
3. "luxury advertising style"
4. "minimal aesthetic"

**Success Criteria**: Product unchanged, background/lighting modified

---

### Scoring System

For each prompt test:
- ✅ **Pass (3 points)**: Composition preserved, subjects intact, edits applied as filters
- ⚠️ **Partial (2 points)**: Minor composition changes, mostly preserved
- ❌ **Fail (1 point)**: Image regenerated, composition lost, subjects changed

**Target**: 32/40 points (80% success rate)

**If below 70%**:
- System prompts need refinement
- Consider switching to GPT-4 Vision or Claude 3.5 Sonnet
- Add more explicit constraints

---

## 📊 WEEK 1: Analytics Validation

### Day 1-2: Local Testing

```bash
# 1. Start development server
npm run dev

# 2. Open browser console
# 3. Perform these actions:
```

**Test Checklist**:
- [ ] Upload image → Check console for `[Analytics] image_uploaded`
- [ ] Click preset → Check `[Analytics] preset_used`
- [ ] Submit edit → Check `[Analytics] edit_started` and `edit_completed`
- [ ] Navigate versions → Check `[Analytics] version_changed`
- [ ] Open comparison → Check `[Analytics] comparison_viewed`
- [ ] Share image → Check `[Analytics] share_attempted`

**Verify localStorage**:
```javascript
// In browser console:
JSON.parse(localStorage.getItem('analytics_events'))
```

Should show array of events with timestamps.

---

### Day 3-4: Usage Limits Testing

**Test Free Tier Limits**:

1. Clear localStorage: `localStorage.clear()`
2. Upload 5 different images and edit each
3. On 6th edit attempt → Should show upgrade modal
4. Close modal → Edit blocked
5. Wait until next day OR manually reset:
   ```javascript
   localStorage.removeItem('usage_data')
   ```

**Test Pro Status**:
```javascript
localStorage.setItem('is_pro', 'true')
// Reload page
// Try 20+ edits → Should work without limit
```

---

## 🚀 WEEK 2-3: Public Launch

### Option A: Reddit Soft Launch

**Target Subreddits**:
- r/SideProject
- r/IMadeThis
- r/web_design
- r/photography (be careful, read rules first)

**Post Template**:
```
Title: I built an AI photo editor where you just type what you want (no sliders)

Body:
I spent the last [X] weeks building SnapMod - an AI photo editor that
understands natural language.

Instead of adjusting 47 sliders, you just say:
- "make it cinematic"
- "golden hour lighting"
- "professional studio look"

Here are 3 before/after examples:
[imgur album with your best results]

It's a PWA so you can install it on your phone in one tap.

Try it: https://snapmod.app

Looking for honest feedback - what breaks? What's confusing?

Built with Next.js 16, OpenRouter (Gemini 2.5 Flash Image), and a lot of
prompt engineering to prevent the AI from regenerating your photos.

[Optional: Tech stack details if subreddit wants it]
```

**Expected Results**:
- 50-200 users in 48 hours
- 10-30 comments with feedback
- 2-5 bug reports

---

### Option B: Twitter Launch

**Thread Structure**:

```
1/ I built an AI Instagram filter where you just type what you want

Instead of learning Lightroom, you say "cinematic" or "golden hour"

Here's the same photo with 3 different prompts:
[comparison images]

2/ The hard part wasn't the AI integration - it was preventing the model
from regenerating your entire photo

I wrote a 500-word system prompt that forces it to treat edits as filters,
not transformations

Before/after adding the system prompt:
[show failure case vs success]

3/ It's a PWA so you can install it on your phone in one tap

Try it: https://snapmod.app

Free tier: 5 edits/day
Pro: $4.99/month unlimited

Looking for early feedback!

4/ Tech stack for the builders:
- Next.js 16 (App Router)
- OpenRouter API (Gemini 2.5 Flash Image)
- Framer Motion for animations
- IndexedDB for version history
- Edge runtime for low latency

All client-side storage = zero friction signup
```

**Boost Strategy**:
- Tag @OpenRouterAI (they might retweet)
- Tag micro-influencers in AI/no-code space
- Post between 10am-2pm EST for max engagement

**Expected Results**:
- 100-500 users if it gets traction
- 1-5 retweets from micro-influencers
- Follow-up questions about monetization/tech

---

### Option C: ProductHunt (Week 3)

**DO NOT LAUNCH YET** - Wait until you have:
1. ✅ 100+ early users
2. ✅ Fixed critical bugs from Reddit/Twitter feedback
3. ✅ 3-5 glowing testimonials
4. ✅ Professional demo video (1-2 minutes)

**Preparation Checklist**:
- [ ] Create demo video showing:
  - Problem: "Editing photos is too complex"
  - Solution: "Just type what you want"
  - 3 transformations (portrait, landscape, product)
  - Mobile install process
  - "Try it free" CTA
- [ ] Write "first comment" explaining tech and asking for feedback
- [ ] Prepare "Product Hunt Special" offer (e.g., lifetime pro for $19)
- [ ] Schedule launch for Tuesday-Thursday (best engagement days)
- [ ] Recruit 5-10 friends to upvote in first hour

**Expected Results**:
- 200-500 upvotes (top 10 of the day)
- 2,000-5,000 visitors
- 200-500 signups
- Press coverage if you hit #1-3

---

## 🧪 A/B Testing Recommendations

### Week 2-3: Test System Prompts

**Hypothesis**: System prompts improve edit quality

**Implementation**:
```typescript
// In app/api/nano-banana/route.ts
const USE_SYSTEM_PROMPT = Math.random() > 0.5; // 50/50 split

if (USE_SYSTEM_PROMPT) {
  messages.push({
    role: 'system',
    content: SYSTEM_PROMPTS[mode]
  });
}

// Log which variant
console.log(`[A/B Test] System prompt: ${USE_SYSTEM_PROMPT}`);
```

**Metrics to Track**:
- Edit success rate (no errors)
- User retention (do they edit again?)
- Share rate (do they share results?)

**Success**: System prompt variant has 20%+ higher retention

---

### Week 3-4: Test Pricing

**Hypothesis**: $4.99/month is optimal price point

**Variants to Test**:
- A: $2.99/month (lower barrier)
- B: $4.99/month (current)
- C: $9.99/month (premium positioning)

**Implementation**: Manually segment users by week
- Week 3: Show $2.99
- Week 4: Show $4.99
- Week 5: Show $9.99

**Metrics**:
- Conversion rate to paid
- Monthly recurring revenue
- Churn rate

---

## 📈 Success Metrics

### Week 1 (Validation)
- [ ] System prompts work 80%+ of the time
- [ ] 10 beta testers give feedback
- [ ] 0 critical bugs found

### Week 2-3 (First 100 Users)
- [ ] 100 unique visitors
- [ ] 20%+ try editing (20 users)
- [ ] 10%+ edit multiple times (10 users)
- [ ] 5% share results (5 users)

### Month 1 (Growth)
- [ ] 500 total users
- [ ] 100 weekly active users
- [ ] 10 paying customers
- [ ] $50 MRR

### Month 3 (Scale)
- [ ] 2,000 total users
- [ ] 500 weekly active users
- [ ] 100 paying customers
- [ ] $500 MRR

---

## 🐛 Known Issues to Monitor

### High Priority
1. **Gemini may ignore system prompts**
   - Monitor: How often edits fail composition check
   - Mitigation: Switch to Claude 3.5 Sonnet if needed

2. **Rate limiting too aggressive**
   - Monitor: 429 error rate in logs
   - Mitigation: Increase from 20/min to 30/min

3. **iOS PWA install friction**
   - Monitor: Install rate on iOS vs Android
   - Mitigation: Add install instructions modal

### Medium Priority
4. **Image caching storage limits**
   - Monitor: IndexedDB quota errors
   - Mitigation: Clear old versions after 50

5. **Slow AI response times**
   - Monitor: Time from submit to result
   - Mitigation: Switch to faster model or add streaming

### Low Priority
6. **Desktop UX not optimized**
   - Monitor: Desktop vs mobile usage
   - Mitigation: Add keyboard shortcuts guide

---

## 🎬 Demo Video Script

**Duration**: 90 seconds

**Scene 1 (0-15s)**: Problem
- Screen record: Opening Photoshop/Lightroom
- Voiceover: "Editing photos shouldn't require a PhD"

**Scene 2 (15-30s)**: Solution
- Screen record: Opening SnapMod, uploading image
- Voiceover: "Just type what you want"

**Scene 3 (30-60s)**: Transformations
- Show 3 rapid edits:
  - Portrait → "cinematic"
  - Landscape → "golden hour"
  - Product → "professional"
- Side-by-side comparisons

**Scene 4 (60-75s)**: Features
- Version history
- Comparison slider
- Share button

**Scene 5 (75-90s)**: CTA
- Text overlay: "Try SnapMod free"
- QR code to snapmod.app
- Voiceover: "5 free edits per day, upgrade for unlimited"

---

## 🔧 Pre-Launch Checklist

### Technical
- [ ] Test on iPhone 14 Pro (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on Desktop (Chrome, Firefox, Safari)
- [ ] Verify PWA manifest works
- [ ] Check all analytics fire correctly
- [ ] Test rate limiting doesn't block real users
- [ ] Verify upgrade modal shows at limit
- [ ] Test share functionality on mobile

### Content
- [ ] Create 10 demo before/after images
- [ ] Write productHunt description
- [ ] Prepare Twitter thread
- [ ] Record demo video
- [ ] Get 3-5 early testimonials

### Business
- [ ] Set up domain (snapmod.app)
- [ ] Configure Stripe (for future payments)
- [ ] Create Twitter account @SnapModApp
- [ ] Prepare customer support email
- [ ] Write FAQ page

---

## 🚨 Emergency Rollback Plan

If critical bugs are found after launch:

1. **Revert to previous commit**:
   ```bash
   git revert HEAD
   git push
   ```

2. **Disable new features**:
   ```typescript
   // In app/page.tsx
   const ENABLE_PRESETS = false;
   const ENABLE_USAGE_LIMITS = false;
   const ENABLE_ANALYTICS = false;
   ```

3. **Notify users**:
   - Post on Twitter
   - Email beta testers
   - Add banner to app

---

## 📞 Support

**Your Next Steps**:
1. Run system prompt tests TODAY
2. Share results with me
3. I'll help you iterate on prompts or switch models
4. Launch publicly within 7 days

**Questions**?
- Technical issues → Check console logs
- Feature requests → Create GitHub issue
- Strategy questions → DM me the results

---

**Ready to launch? Let's make SnapMod the standard by 2026.** 🚀
