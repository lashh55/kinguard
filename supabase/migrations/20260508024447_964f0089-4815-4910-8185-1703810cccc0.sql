
-- Quiz questions bank
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  answer_a TEXT NOT NULL,
  answer_b TEXT NOT NULL,
  answer_c TEXT NOT NULL,
  answer_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  explanation TEXT NOT NULL,
  scam_category TEXT NOT NULL,
  rotation_group INTEGER NOT NULL DEFAULT 1,
  times_shown INTEGER NOT NULL DEFAULT 0,
  last_shown_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authed can read quiz" ON public.quiz_questions
  FOR SELECT TO authenticated USING (true);

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  was_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user view own attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user insert own attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow seniors (and guardians) to remove guardian links
CREATE POLICY "senior or guardian can delete link" ON public.guardian_relationships
  FOR DELETE USING (auth.uid() = senior_id OR auth.uid() = guardian_id);

-- Insert all 28 questions
INSERT INTO public.quiz_questions
  (question_text, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, scam_category, rotation_group)
VALUES
('You get a call from someone claiming to be the IRS saying you owe back taxes and will be arrested today if you don''t pay. What should you do?',
 'Pay immediately to avoid arrest','Ask them to call back later','Hang up — the IRS contacts you by mail first','Give them your bank account number','c',
 'The IRS always sends official letters by mail before calling. They never demand immediate payment by phone.','irs',1),
('The IRS calls and asks you to pay your tax debt using iTunes gift cards. This is:',
 'A normal IRS payment method','Only for amounts over $1,000','Always a scam — the IRS never accepts gift cards','Fine if the agent gives you a badge number','c',
 'No government agency ever accepts gift cards as payment. This is always a scam.','irs',1),
('You receive an email from "irs.gov-refund.com" saying you have a $1,200 refund waiting. What is the first red flag?',
 'The refund amount seems too high','The email address is not a real IRS domain','They want your name','The email came on a weekend','b',
 'The real IRS only uses @irs.gov email addresses, never third-party domains.','irs',1),
('A Social Security agent calls saying your SSN has been suspended. They need your SSN to reactivate it. You should:',
 'Give them your SSN to fix the problem','Ask them to send a letter','Hang up and call SSA directly at 1-800-772-1213','Give them only the last 4 digits','c',
 'SSNs cannot be suspended. This is a common scam tactic.','irs',1),
('How does the REAL IRS first contact you about a tax problem?',
 'Phone call','Text message','Official letter by mail','Email','c',
 'The IRS always contacts you by mail first. Never by text or unexpected phone call.','irs',1),
('A popup says "VIRUS DETECTED — Call Microsoft immediately." What do you do?',
 'Call the number right away','Click the popup to close it','Close the browser or restart — it''s a scam','Give them remote access to fix it','c',
 'Real virus alerts never include phone numbers. This is a classic tech support scam.','tech',2),
('Someone from "Windows Support" calls saying your computer is sending errors to Microsoft. They want remote access. This is:',
 'A scam — never give remote access to someone who called you','Normal — Microsoft monitors all computers','Fine if they know your computer model','OK if they give you a case number','a',
 'Microsoft never calls you out of the blue about your computer.','tech',2),
('A tech support scammer''s main goal is usually to:',
 'Fix your computer for free','Warn you about a real virus','Steal your money or personal information','Sell you a new computer','c',
 'Their goal is always to gain access to your money or accounts.','tech',2),
('You get an email saying your Norton subscription auto-renewed for $299. Call immediately to cancel. You should:',
 'Call the number in the email','Reply with your card info','Go directly to Norton.com and log in to check your account','Pay it since you probably forgot','c',
 'Never call numbers in unexpected emails. Go directly to the company''s real website.','tech',2),
('Which is a warning sign of a tech support scam?',
 'They send you a written quote first','They have a professional website','They contacted you first and create urgency','They ask for your name and address','c',
 'Scammers always contact you first and pressure you to act fast.','tech',2),
('Someone calls claiming to be your grandson in jail. He needs $2,000 in gift cards right away and begs you not to tell his parents. You should:',
 'Buy the gift cards immediately','Wire the money through Western Union','Hang up and call your grandson on his real number','Ask the caller for more details','c',
 'Always verify by calling your grandchild directly before doing anything.','grandparent',3),
('In a grandparent scam, why does the scammer say not to tell other family members?',
 'To protect your grandchild''s privacy','So no one can warn you it''s a scam','Because it''s a legal matter','To process payment faster','b',
 'Isolation is the scammer''s most important tool.','grandparent',3),
('A "lawyer" demands bail money by wire transfer within the hour. This urgency is designed to:',
 'Help your grandchild faster','Prevent you from thinking clearly or checking facts','Meet a court deadline','Secure a lower bail amount','b',
 'Scammers create urgency so you don''t have time to verify the story.','grandparent',3),
('Your "grandchild" sounds different because of a "broken nose." You should:',
 'Accept the explanation and send money','Hang up and call your grandchild''s real phone number to verify','Ask for the hospital''s name','Send half the money now and verify later','b',
 'Always verify directly with the real person.','grandparent',3),
('Gift cards are red flags in grandparent scams because:',
 'They expire too quickly','Grandchildren prefer cash','They are untraceable and cannot be refunded once used','They are only sold in small amounts','c',
 'Scammers love gift cards because they get the money instantly and it cannot be traced.','grandparent',3),
('Someone calls offering a free back brace and only needs your Medicare number. You should:',
 'Give your number — it''s free','Hang up — this is a Medicare scam','Give it if you actually need the item','Ask them to call back','b',
 'Scammers use your Medicare number to bill the government fraudulently.','medicare',4),
('A caller says Medicare is issuing new cards and needs your Medicare and Social Security numbers. This is:',
 'A scam — Medicare mails new cards automatically','A routine Medicare update process','Required every 3 years','Fine if the caller knows your birthday','a',
 'Medicare never calls asking for your numbers. New cards are mailed.','medicare',4),
('Which would Medicare NEVER do?',
 'Send you a paper statement','Mail your Medicare card','Call you asking for your Medicare number','Cover your annual wellness visit','c',
 'Medicare only contacts you by mail.','medicare',4),
('A company calls offering a free COVID test and needs your Medicare and bank account numbers to ship it. You should:',
 'Hang up — no company needs your bank number for a free item','Give the info since the kit is free','Give Medicare number but not bank number','Ask them to email you the form','a',
 'No legitimate company needs your bank account to ship a free item.','medicare',4),
('An online ad offers a free cancer screening covered by Medicare. They just need your Medicare number. This is likely:',
 'A legitimate Medicare benefit','A scam using Medicare billing fraud','A new government program','Fine if the company looks professional','b',
 'Free screening ads asking for your Medicare number are almost always fraud.','medicare',4),
('Someone emails saying your SSN has been compromised and you must call immediately to get a new one. You should:',
 'Call the number right away','Ignore it — Social Security numbers cannot be changed this way','Reply with your SSN to verify','Forward it to a friend to check','b',
 'SSNs are permanent. No one can issue you a new one over the phone.','ssn',5),
('Where is it safe to enter your Social Security Number online?',
 'Any website that looks professional','Websites that offer you something free','Official .gov websites or verified employer and bank portals','Websites that promise to protect your SSN','c',
 'Only enter your SSN on official government sites or portals you''ve verified independently.','ssn',5),
('A caller says your SSN was used in a crime and you must verify your number to clear your name. You should:',
 'Verify your SSN to protect yourself','Hang up and call the Social Security Administration directly','Give them your last 4 digits only','Ask them to email you the case number','b',
 'Call SSA directly at 1-800-772-1213 to verify anything SSN-related.','ssn',5),
('What is the IRS Identity Protection PIN?',
 'Your Social Security Number','A free 6-digit PIN that blocks anyone from filing taxes using your SSN','A password for your IRS online account','A code sent when you are audited','b',
 'The IRS IP PIN is free and one of the best ways to protect from tax fraud.','ssn',5),
('Freezing your credit at all three bureaus means:',
 'You can no longer use your credit cards','Your credit score will drop permanently','No one can open a new account in your name even if they have your SSN','You must unfreeze it every month','c',
 'A credit freeze is free, does not affect your score, and is one of the strongest protections against identity theft.','ssn',5),
('Someone you met on Facebook says they love you after just one week of chatting. They are overseas and ask for money for a medical emergency. You should:',
 'Send money — they clearly love you','Send half and wait to see what happens','Never send money to someone you have not met in person','Ask for their bank account details first','c',
 'Romance scammers spend weeks building trust before asking for money.','romance',6),
('A person you met online refuses to video chat or meet in person. They always have an excuse. This is:',
 'Normal — they are just shy','A major red flag for a romance scam','Fine if they have sent you photos','OK if they have many social media friends','b',
 'Scammers use fake photos and profiles. They will never agree to video chat.','romance',6),
('An online romantic partner asks you to send money using gift cards, wire transfer, or cryptocurrency. This is:',
 'Normal for international relationships','Always a scam — these methods are untraceable','Fine if they promise to pay you back','OK if they have sent you gifts before','b',
 'Scammers demand untraceable payment methods so the money cannot be recovered.','romance',6);
