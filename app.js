/* INFO 4300 Section 5. Buildless and self-contained. All examples are fictional. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const lesson = window.LESSON.segments;
const audioData = window.AUDIO_DATA || {};
const audio = $('#narration');
let current = 0, captionsVisible = true, activeCue = -1, activeSignal = -1;
let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let view = 'home';
const bookmarkKey='info4300-s5-chapter-v1';
let savedChapter=null,bookmarkAvailable=true;
try{const value=localStorage.getItem(bookmarkKey);if(value!==null&&Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<lesson.length)savedChapter=Number(value);}catch{bookmarkAvailable=false;}
function showBookmark(){
 $('#resume-chapter').hidden=savedChapter===null;
 if(savedChapter!==null)$('#resume-chapter').textContent=`Continue from chapter ${savedChapter+1}: ${lesson[savedChapter].short}`;
 $('#bookmark-note').textContent=bookmarkAvailable?'Your last chapter is saved in this browser.':'Browser storage is unavailable. Your chapter is remembered for this visit only.';
}
function saveChapter(index){savedChapter=index;try{localStorage.setItem(bookmarkKey,String(index));}catch{bookmarkAvailable=false;}showBookmark();}

const phases = window.LESSON.phases;
const shortTitles = lesson.map(s=>s.short);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signal = (phrase,content,cls='') => `<div class="signal ${cls}" data-signal="${escapeHTML(phrase)}">${content}</div>`;
const figNote = '<p class="visual-note">Cedar Crossing is fictional. All proposed actions, conditions, targets, and results are teaching examples.</p>';
const visuals = Object.fromEntries(Object.entries(window.LESSON.visuals).map(([id,markup])=>[id,()=>markup]));

function showView(name){
 audio.pause();
 if (view==='game' && name!=='game') pauseGame(true);
 ['home','lesson','game','finish'].forEach(id=>$('#'+id).hidden=id!==name);
 view=name;
 window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});
}
function renderLesson(index,focus=true){
 current=Math.max(0,Math.min(lesson.length-1,index));
 const s=lesson[current];
 saveChapter(current);
 showView('lesson');
 audio.pause(); audio.removeAttribute('src'); audio.load();
 const meta=audioData[s.id] || {filename:`narration-${s.id}.mp3`,captions:`narration-${s.id}.vtt`,cues:[]};
 audio.src=meta.filename || meta.audioFilename || `narration-${s.id}.mp3`;
 audio.playbackRate=Number($('#speed').value);audio.muted=$('#mute-all').checked;
 audio.load();
 activeCue=-1;activeSignal=-1;
 $('#media-error').hidden=true;
 $('#media-error').textContent='Audio is unavailable. You can read this chapter below or open the full transcript.';
 $('#chapter-kicker').textContent=s.chapter;
 $('#chapter-title').textContent=s.title;
 $('#progress-text').textContent=`${current+1} of ${lesson.length}`;
 $('#lesson-progress').max=lesson.length;
 $('#lesson-progress').value=current+1;
 $('#page-label').textContent=`Chapter ${current+1} / ${lesson.length}`;
 $('#chapter-select').value=current;
 $$('.chapter-button').forEach((b,i)=>{if(i===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
 $('#route').innerHTML=phases.map((p,i)=>`<li class="${i===s.phase?'active':''}" ${i===s.phase?'aria-current="step"':''}>${p}</li>`).join('');
 $('#visual').innerHTML=visuals[s.id]();
 $('#takeaway').textContent=s.takeaway;
 $('#captions').textContent='Press Play to hear this chapter. Captions appear here.';
 $('#captions').hidden=!captionsVisible;
 $('#download-audio').href=audio.getAttribute('src');
 $('#caption-download').href=meta.captions || `narration-${s.id}.vtt`;
 $('#chapter-text').innerHTML=`<p>${escapeHTML(s.narration)}</p><div class="visual-description"><strong>Visual description:</strong> ${escapeHTML(s.description)}</div>`;
 $('#chapter-transcript').open=false;
 $('#explore-content').innerHTML=s.explore.map(([h,p])=>`<h3>${escapeHTML(h)}</h3><p>${escapeHTML(p)}</p>`).join('');
 if(s.id==='case') $('#explore-content').insertAdjacentHTML('beforeend','<p><a href="https://info4300.github.io/INFO4300_Section5/">Open the existing Section 5 course guide</a></p>');
 if(s.id==='ethics') $('#explore-content').insertAdjacentHTML('beforeend','<p><a href="https://www.ala.org/tools/ethics">American Library Association: Code of Ethics</a> (amended 2021).</p>');
 $('.explore').open=false;
 $('#previous').disabled=current===0;
 $('#next').textContent=current===lesson.length-1?'Optional game →':'Next →';
 renderPractice(s);
 if(focus) $('#chapter-title').focus({preventScroll:true});
}
function renderPractice(s){
 const slot=$('#practice-slot');
 if(!s.question){slot.innerHTML='';return;}
 slot.innerHTML=`<section class="practice" aria-label="Optional practice"><div class="practice-heading"><div><span class="small-label">TRY IT / ABOUT 20 SECONDS</span><h2>Put the idea to work</h2></div><button class="compact" id="open-practice">Try it</button></div><div id="practice-body" hidden><p class="question" id="question-text">${escapeHTML(s.question.prompt)}</p><div class="practice-options" role="group" aria-labelledby="question-text">${s.question.choices.map((c,i)=>`<button data-answer="${i}" aria-pressed="false">${escapeHTML(c)}</button>`).join('')}</div><div id="practice-feedback" role="status"></div><div class="practice-actions"><button class="text-button" id="retry-practice">Try again</button><button class="text-button" id="finish-practice">Continue lesson</button></div></div><button class="text-button" id="skip-practice">Skip this practice</button></section>`;
 $('#open-practice').onclick=()=>{audio.pause();$('#practice-body').hidden=false;$('#open-practice').hidden=true;$('.practice-options button').focus()};
 $$('.practice-options button').forEach(b=>b.onclick=()=>{
 audio.pause(); const i=Number(b.dataset.answer);
 $$('.practice-options button').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));
 $('#practice-feedback').className='practice-feedback';
 $('#practice-feedback').textContent=s.question.feedback[i];
 });
 $('#retry-practice').onclick=()=>{audio.pause();$$('.practice-options button').forEach(b=>b.setAttribute('aria-pressed','false'));$('#practice-feedback').textContent='';$('#practice-feedback').className='';$('.practice-options button').focus()};
 const finish=()=>{audio.pause();$('#practice-body').hidden=true;$('#open-practice').hidden=false;$('#open-practice').textContent='Revisit';$('#media-error').hidden=true;$('#next').focus()};
 $('#finish-practice').onclick=finish;$('#skip-practice').onclick=finish;
}
function updateAudio(){
 const cues=(audioData[lesson[current].id]||{}).cues||[];
 const t=audio.currentTime;
 const i=cues.findIndex(c=>t>=c.start && t<c.end);
 if(i!==activeCue){activeCue=i;$('#captions').textContent=i>=0?cues[i].text:(audio.ended?'Chapter narration finished. Revisit any part, try the practice, or continue.':'');}
 let chosen=null;
 const spoken=cues.filter(c=>c.start<=t).map(c=>c.text.toLowerCase()).join(' ');
 $$('#visual [data-signal]').forEach(el=>{if(spoken.includes(el.dataset.signal.toLowerCase()))chosen=el});
 $$('#visual .signal').forEach(el=>el.classList.toggle('is-speaking',el===chosen));
}
audio.addEventListener('timeupdate',updateAudio);
audio.addEventListener('ended',()=>{$('#captions').textContent='Chapter narration finished. Revisit any part, try the practice, or continue.'});
audio.addEventListener('error',()=>{$('#media-error').hidden=false});
audio.addEventListener('play',()=>{if(view!=='lesson')audio.pause(); const pb=$('#practice-body');if(pb&&!pb.hidden){audio.pause();$('#media-error').hidden=false;$('#media-error').textContent='Narration is paused during practice. Choose Continue lesson, then press Play to resume.';}});
$('#speed').onchange=()=>{audio.defaultPlaybackRate=Number($('#speed').value);audio.playbackRate=audio.defaultPlaybackRate};
audio.addEventListener('loadedmetadata',()=>{audio.playbackRate=Number($('#speed').value)});
$('#replay').onclick=()=>{audio.pause();audio.currentTime=0;audio.play().catch(()=>{$('#media-error').hidden=false})};
$('#toggle-captions').onclick=()=>{captionsVisible=!captionsVisible;$('#captions').hidden=!captionsVisible;$('#toggle-captions').textContent=captionsVisible?'Hide captions':'Show captions';$('#toggle-captions').setAttribute('aria-pressed',String(captionsVisible))};
$('#mute-all').onchange=()=>audio.muted=$('#mute-all').checked;
$('#narration-volume').oninput=()=>audio.volume=Number($('#narration-volume').value);
$('#reduce-motion').checked=reduced;
document.body.classList.toggle('reduce-motion',reduced);
$('#reduce-motion').onchange=()=>{reduced=$('#reduce-motion').checked;document.body.classList.toggle('reduce-motion',reduced);};
$('#chapter-nav').innerHTML=lesson.map((s,i)=>`<button class="chapter-button" data-chapter="${i}"><b>${String(i+1).padStart(2,'0')}</b><span>${shortTitles[i]}</span></button>`).join('');
$('#chapter-select').innerHTML=lesson.map((s,i)=>`<option value="${i}">${i+1}. ${shortTitles[i]}</option>`).join('');
$$('.chapter-button').forEach(b=>b.onclick=()=>renderLesson(Number(b.dataset.chapter)));
$('#chapter-select').onchange=()=>renderLesson(Number($('#chapter-select').value));
$('#start').onclick=()=>renderLesson(0);
$('#resume-chapter').onclick=()=>renderLesson(savedChapter??0);
showBookmark();
$('#previous').onclick=()=>renderLesson(current-1);
$('#next').onclick=()=>current<lesson.length-1?renderLesson(current+1):openGame();
$('#go-home').onclick=()=>{showView('home');$('#start').focus()};
$('#jump-game').onclick=()=>openGame();
$('#review-case').onclick=()=>renderLesson(lesson.length-1);
$('#replay-game').onclick=()=>{openGame();resetGame()};
$('#skip-game').onclick=()=>finishLesson();
function finishLesson(){showView('finish');$('#finish-title').focus({preventScroll:true});}

// Game: timers advance only while a timed question is active and the page is visible.
const questions=window.LESSON.games;
let state={round:-1,score:0,lives:3,streak:0,active:false,paused:false,elapsed:0,limit:30,mode:'untimed',finished:false,started:false};
let raf=0,lastFrame=0,gameSounds=false,audioContext=null;
let sessionBest={timed:0,untimed:0},storageAvailable=true;
function mode(){return $('input[name="game-mode"]:checked').value}
if(reduced){$('input[name="game-mode"][value="untimed"]').checked=true;}
function readBest(m){try{return Math.max(sessionBest[m],Number(localStorage.getItem('info4300-s5-shift-v1-'+m))||0)}catch{storageAvailable=false;return sessionBest[m]}}
function saveBest(){if(state.score>readBest(state.mode)){sessionBest[state.mode]=state.score;try{localStorage.setItem('info4300-s5-shift-v1-'+state.mode,String(state.score))}catch{storageAvailable=false}}}
function stats(){
 $('#score').textContent=state.score;$('#lives').textContent=state.lives;$('#streak').textContent=state.streak;$('#best').textContent=readBest(state.started?state.mode:mode());
 $('#best').title=storageAvailable?'Saved only in this browser on this device.':'Browser storage is unavailable; best is kept for this visit only.';
}
function announce(s){$('#game-announcement').textContent=s}
function openGame(){showView('game');stats();$('#game-heading').focus({preventScroll:true});}
function setBaskets(enabled){$$('[data-basket]').forEach(b=>b.disabled=!enabled)}
function sound(correct){if(!gameSounds)return;try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=correct?660:220;g.gain.setValueAtTime(.04,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.13);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.14)}catch{}}
function resetGame(){
 cancelAnimationFrame(raf);state={round:-1,score:0,lives:3,streak:0,active:false,paused:false,elapsed:0,limit:30,mode:mode(),finished:false,started:false};
 $('#round-label').textContent='Ready for your shift?';$('#clock').textContent='';$('#gold-label').textContent='START WITH A PRACTICE TURN';$('#statement').textContent='Choose your pace, then start with an unscored practice decision. Every turn pauses for feedback.';$('#book-card').className='book-card';$('#book-card').style.transform='';$('#game-feedback').textContent='';$('#game-start').hidden=false;$('#game-continue').hidden=true;$('#game-pause').disabled=true;$('#game-pause').textContent='Pause';$$('input[name="game-mode"]').forEach(r=>r.disabled=false);setBaskets(false);$$('[data-basket]').forEach((b,i)=>b.textContent=`Response ${i+1}`);stats();
}
function startRound(){
 if(state.round>=questions.length || state.lives<=0){endGame();return;}
 const q=questions[state.round];
 $$('[data-basket]').forEach((b,i)=>b.innerHTML=`<span class="basket-number" aria-hidden="true">${i+1}</span><span>${escapeHTML(q.choices[i])}</span>`);
 state.active=true;state.paused=false;state.elapsed=0;state.limit=q.practice?40:30;
 $('#round-label').textContent=q.practice?'Practice turn · no points or lost lives':`Decision ${state.round} of ${questions.length-1}`;
 $('#gold-label').textContent=q.practice?'PRACTICE':q.golden?'BONUS DECISION · DOUBLE POINTS + A BONUS LIFE':'CHOOSE YOUR RESPONSE';
 $('#book-card').className='book-card'+(q.golden?' golden':'');$('#book-card').style.transform='translateY(0)';$('#statement').textContent=q.statement;$('#game-feedback').textContent='';$('#game-continue').hidden=true;$('#game-start').hidden=true;$('#game-pause').disabled=false;$('#game-pause').textContent='Pause';setBaskets(true);
 announce(`${q.practice?'Practice':q.golden?'Bonus decision':'Question'}. ${q.statement} ${q.choices.map((c,i)=>`${i+1}. ${c}`).join(' ')}`);
 $('#game-board').focus({preventScroll:true});lastFrame=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function tick(now){
 if(!state.active)return;
 const dt=Math.max(0,now-lastFrame);lastFrame=now;
 if(!state.paused && !document.hidden && state.mode==='timed'){
 state.elapsed+=dt/1000;const pct=Math.min(1,state.elapsed/state.limit);
 $('#book-card').style.transform='';
 $('#clock').textContent=Math.max(0,Math.ceil(state.limit-state.elapsed))+' sec';
 if(pct>=1){answer(-1);return;}
 }else{$('#clock').textContent=state.paused?'Paused':state.mode==='untimed'?'Untimed':'';}
 raf=requestAnimationFrame(tick);
}
function answer(choice){
 if(!state.active||state.paused)return;
 const q=questions[state.round],correct=choice===q.answer;state.active=false;cancelAnimationFrame(raf);setBaskets(false);$('#game-pause').disabled=true;$('#clock').textContent='Feedback · clock paused';
 let reward='';
 if(!q.practice){
 if(correct){state.streak++;const bonus=Math.min(100,Math.max(0,state.streak-1)*20);const points=(100+bonus)*(q.golden?2:1);state.score+=points;reward=` +${points} points${bonus?' including a streak bonus':''}.`;if(q.golden){state.lives=Math.min(5,state.lives+1);reward+=' One bonus life, up to five.';}}
 else{state.lives--;state.streak=0;reward=' One life used. The explanation stays available.';}
 }else{reward=' Practice does not affect points or lives.';}
 const prefix=choice===-1?'Time is up. ':correct?'Good decision. ':'Consider the feedback. ';
 const response=choice>=0?q.feedback[choice]:'The strongest response here is: '+q.choices[q.answer]+' '+q.explanation;
 $('#game-feedback').textContent=prefix+response+(choice>=0&&!correct?' Stronger response: '+q.choices[q.answer]+' '+q.explanation:'')+reward;
 $('#game-continue').hidden=false;$('#game-continue').textContent=state.round===questions.length-1||state.lives<=0?'See results':'Continue →';
 stats();sound(correct);$('#game-continue').focus({preventScroll:true});
}
function pauseGame(force=false){
 if(!state.active)return;
 state.paused=force?true:!state.paused;lastFrame=performance.now();$('#game-pause').textContent=state.paused?'Resume':'Pause';setBaskets(!state.paused);$('#clock').textContent=state.paused?'Paused':'';announce(state.paused?'Game paused. Choose Resume when ready.':'Game resumed.');
}
function endGame(){
 state.active=false;state.finished=true;cancelAnimationFrame(raf);setBaskets(false);saveBest();stats();$('#round-label').textContent='Your shift is complete';$('#clock').textContent='';$('#gold-label').textContent='THANKS FOR PLAYING';$('#statement').textContent=`${state.score} points. Review the feedback and try another shift when you like.`;$('#book-card').style.transform='';$('#book-card').className='book-card';$('#game-feedback').textContent='You can replay, try the other mode, or return to the case preparation. All decisions, choices, and feedback are also in the full transcript.';$('#game-continue').hidden=false;$('#game-continue').textContent='Return to course next steps';$('#game-pause').disabled=true;$$('input[name="game-mode"]').forEach(r=>r.disabled=false);announce(`Finished with ${state.score} points. Best on this device in ${state.mode} mode: ${readBest(state.mode)}.`);$('#game-continue').focus({preventScroll:true});
}
$('#game-start').onclick=()=>{state.started=true;state.mode=mode();state.round=0;$$('input[name="game-mode"]').forEach(r=>r.disabled=true);startRound()};
$('#game-continue').onclick=()=>{if(state.finished){finishLesson();return;}state.round++;startRound()};
$('#game-pause').onclick=()=>pauseGame();
$('#game-restart').onclick=()=>{resetGame();$('#game-start').focus({preventScroll:true})};
$$('[data-basket]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.basket)));
$('#game-board').addEventListener('keydown',e=>{if(!$('#game-shortcuts').checked||e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;if(['1','2','3'].includes(e.key)&&state.active&&!state.paused){e.preventDefault();answer(Number(e.key)-1)}});
$$('input[name="game-mode"]').forEach(r=>r.onchange=()=>{if(!state.active){resetGame();stats()}});
$('#game-sound').onclick=()=>{gameSounds=!gameSounds;$('#game-sound').textContent=gameSounds?'Sounds on':'Sounds off';$('#game-sound').setAttribute('aria-pressed',String(gameSounds));if(gameSounds)sound(true)};
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.pause();pauseGame(true)}});
stats();
})();
