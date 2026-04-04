const fs = require('fs');

const engNames = ["Kelvin", "Chloe", "Jason", "Alex", "Sam", "Jack", "Ryan", "Ivan", "Gary", "Eric", "Kevin", "Marco", "Matthew", "Tommy", "Wilson", "Chris", "David", "Dennis", "Frankie", "Ken", "Leo", "Martin", "Peter", "Raymond", "Simon", "Steven", "Tony", "Victor", "William", "Alice", "Amy", "Carmen", "Cathy", "Cindy", "Fiona", "Grace", "Helen", "Irene", "Janet", "Jenny", "Jessica", "Joyce", "Judy", "Karen", "Kelly", "Maggie", "Mandy", "Mary", "Michelle", "Nicole", "Rachel", "Sally", "Shirley", "Sylvia", "Tracy", "Vivian", "Winnie"];
const engSuffixes = ["_Lau", ".W", "_720", "_Chan", "_Wong", "_Ho", ".C", "_99", "_88", "_Lee", ".K", "_Cheung", "_Yeung", ".Y", "_123", "_HK", "_Ng", ".L", "_007", "_852"];
const localNames = ["呀輝", "老林", "肥仔", "呀玲", "強哥", "達叔", "呀明", "豪仔", "B仔", "華哥", "呀傑", "呀欣", "呀婷", "肥波", "瘦鬼", "高佬", "呀水", "呀發", "呀財", "老陳", "老李", "呀張", "呀何", "呀黃", "呀周", "呀吳", "呀鄭", "呀王", "呀馮", "呀陳", "四眼仔", "大隻佬", "呀珊", "呀敏", "呀儀", "呀偉", "呀俊", "呀龍", "呀鳳", "呀嬌"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const users = [];

for (let i = 1; i <= 200; i++) {
  let displayName = "";
  if (Math.random() < 0.7) {
    displayName = randomChoice(engNames) + randomChoice(engSuffixes);
  } else {
    displayName = randomChoice(localNames);
  }

  let totalTrades = randomInt(5, 300);
  let cancelRate = 0;
  if (Math.random() < 0.05) {
    cancelRate = randomInt(5, 10);
  }

  let ratingPct = 100;
  if (cancelRate > 0) {
    ratingPct = randomInt(90, 97);
  } else if (totalTrades > 30) {
    ratingPct = randomInt(98, 100);
  }

  let identityTier = "bronze";
  let visualTags = [];

  if (totalTrades > 100 && ratingPct > 98) {
    identityTier = "gold";
    visualTags = ["fast_reply", "accurate_desc", "good_packaging"];
  } else if (totalTrades > 30 && ratingPct > 95) {
    identityTier = "silver";
    if (Math.random() < 0.5) {
      visualTags = ["fast_reply"];
    }
  }

  let joinYear = Math.random() < 0.5 ? 2024 : 2025;
  let isVerified = Math.random() < 0.8;

  users.push({
    uid: `U${String(i).padStart(4, '0')}`,
    display_name: displayName,
    identity_tier: identityTier,
    rating_pct: ratingPct,
    total_trades: totalTrades,
    cancel_rate_90d: cancelRate,
    visual_tags: visualTags,
    join_year: joinYear,
    is_verified: isVerified
  });
}

fs.writeFileSync('mock_users.json', JSON.stringify(users, null, 2));
console.log(JSON.stringify(users));
