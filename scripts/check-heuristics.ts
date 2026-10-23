import { runHeuristics } from '../lib/message-heuristics';
import { extractUrls } from '../lib/urls';

const cases = [
  'Dear Customer, your account will be BLOCKED today due to incomplete KYC. Update at http://sbi-kyc-verify.top/login and share the OTP sent to your number.',
  'Congratulations! Work from home part time job, earn Rs 3000 daily. Pay refundable registration fee of Rs 499. Message me on telegram t.me/hr_jobs_fast',
  'Hi, this is Priya from the dentist clinic. Your appointment is confirmed for Thursday at 4 pm.',
];

for (const text of cases) {
  const { score, indicators } = runHeuristics(text);
  console.log('---');
  console.log('text   :', text.slice(0, 60) + '…');
  console.log('score  :', score);
  console.log('matched:', indicators.map((i) => i.label).join(' | ') || '(none)');
  console.log('urls   :', extractUrls(text).join(', ') || '(none)');
}
