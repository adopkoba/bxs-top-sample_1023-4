(function () {
	'use strict';

	var body = document.body;
	var header = document.getElementById('gHeader');
	var menuBtn = document.querySelector('#gHeader .menu');
	var menuBox = document.getElementById('menuBox');
	var pageTop = document.querySelector('.pageTop');
	var scrollPos = 0;
	var isOpen = false;

	/*------------------------------------------------------------
		メニュー（PC・SP 共通。開いている間は背景のスクロールを止める）
	------------------------------------------------------------*/
	function openMenu() {
		scrollPos = window.scrollY;
		body.classList.add('fixed');
		body.style.top = -scrollPos + 'px';
		menuBtn.classList.add('on');
		menuBox.classList.add('on');
		menuBtn.setAttribute('aria-expanded', 'true');
		menuBtn.setAttribute('aria-label', 'メニューを閉じる');
		isOpen = true;
	}
	function closeMenu() {
		body.classList.remove('fixed');
		body.style.top = '';
		window.scrollTo({ top: scrollPos, behavior: 'instant' });
		menuBtn.classList.remove('on');
		menuBox.classList.remove('on');
		menuBtn.setAttribute('aria-expanded', 'false');
		menuBtn.setAttribute('aria-label', 'メニューを開く');
		isOpen = false;
	}
	if (menuBtn && menuBox) {
		menuBtn.addEventListener('click', function () {
			isOpen ? closeMenu() : openMenu();
		});
		menuBox.querySelectorAll('a:not([href^="tel:"])').forEach(function (a) {
			a.addEventListener('click', closeMenu);
		});
		document.addEventListener('keydown', function (e) {
			if (isOpen && e.key === 'Escape') closeMenu();
		});
	}

	/*------------------------------------------------------------
		ページ内リンク：固定ヘッダーの高さ分ずらしてスクロール
	------------------------------------------------------------*/
	document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (a) {
		a.addEventListener('click', function (e) {
			var target = document.querySelector(a.getAttribute('href'));
			if (!target) return;
			e.preventDefault();
			var offset = target.id === 'container' ? 0 : header.offsetHeight;
			requestAnimationFrame(function () {
				var top = target.getBoundingClientRect().top + window.scrollY - offset;
				window.scrollTo({ top: top, behavior: 'smooth' });
			});
		});
	});

	/*------------------------------------------------------------
		MV：写真のクロスフェード（4秒表示 → 1.2秒でフェード。Figma の After Delay 4000ms / 1.2s と同じ）
	------------------------------------------------------------*/
	var slide = document.querySelector('.js-mvSlide');
	var mvCatch = document.querySelector('.js-mvCatch');
	var WHITE_CATCH_SLIDE = 3; // キャッチを白にする写真（0 始まり。4枚目。2026-10-22 ユーザー指示）
	if (slide) {
		var imgs = slide.querySelectorAll('img');
		var current = 0;
		if (imgs.length > 1) {
			setInterval(function () {
				imgs[current].classList.remove('is-active');
				current = (current + 1) % imgs.length;
				imgs[current].classList.add('is-active');
				if (mvCatch) mvCatch.classList.toggle('is-white', current === WHITE_CATCH_SLIDE);
			}, 5200);
		}
	}

	/*------------------------------------------------------------
		固定 CTA の切り替え（PC）
		MV の下端が FV-CTA の下端より上に来たら、FV-CTA → MV 以降 CTA（右端のタブ）に切り替える
		SP は CSS で画面下部に常に表示
	------------------------------------------------------------*/
	var mv = document.getElementById('mv');
	var fvCta = document.getElementById('fvCta');
	var sideCta = document.getElementById('sideCta');
	function toggleCta() {
		if (!sideCta) return;
		var afterMv = true;
		if (mv && fvCta) {
			afterMv = mv.getBoundingClientRect().bottom < fvCta.getBoundingClientRect().bottom;
			fvCta.classList.toggle('hide', afterMv);
		}
		sideCta.classList.toggle('show', afterMv);
	}

	/*------------------------------------------------------------
		英字テキストの無限ループ
		1組（文を n 個）の幅が画面幅以上になるよう複製し、同じ組を2つ並べて CSS で -50% 流す。
		文1つあたりの秒数を保つので、文の数が増えても流れる速さは同じ
	------------------------------------------------------------*/
	var loopTrack = document.querySelector('.js-loopTrack');
	var loopSrc = loopTrack ? loopTrack.querySelector('p') : null;
	var loopW = 0;
	function buildLoop() {
		if (!loopTrack || !loopSrc) return;
		var vw = document.documentElement.clientWidth;
		if (vw === loopW) return;
		loopW = vw;
		loopTrack.innerHTML = '';
		loopTrack.appendChild(loopSrc);
		var unit = loopSrc.getBoundingClientRect().width || 1;
		var n = Math.max(1, Math.ceil(vw / unit));
		for (var i = 1; i < n * 2; i++) {
			loopTrack.appendChild(loopSrc.cloneNode(true));
		}
		var secPerText = window.matchMedia('(max-width: 896px)').matches ? 41 : 67; // 前回（文字 54px で 40 秒／SP 28px で 25 秒）と同じ見た目の速さ。文字を大きくした分だけ秒数を伸ばした
		loopTrack.style.animationDuration = (secPerText * n) + 's';
	}
	buildLoop();
	window.addEventListener('resize', buildLoop);
	if (document.fonts) document.fonts.ready.then(function () { loopW = 0; buildLoop(); });

	/*------------------------------------------------------------
		全国対応ネットワーク：エリアカードにホバーすると地図の該当地域を青くする（PC のみ）
	------------------------------------------------------------*/
	var mapHls = document.querySelectorAll('.netMap .hl');
	document.querySelectorAll('.netArea li').forEach(function (li) {
		var area = li.getAttribute('data-area');
		var link = li.querySelector('a');
		function toggle(on) {
			if (on && !window.matchMedia('(min-width: 897px)').matches) return;
			mapHls.forEach(function (img) {
				img.classList.toggle('is-active', on && img.getAttribute('data-area') === area);
			});
		}
		link.addEventListener('mouseenter', function () { toggle(true); });
		link.addEventListener('mouseleave', function () { toggle(false); });
		link.addEventListener('focus', function () { toggle(true); });
		link.addEventListener('blur', function () { toggle(false); });
	});

	/*------------------------------------------------------------
		タブ切替（製品ラインナップ）。←→ キーでも切り替えられる
	------------------------------------------------------------*/
	document.querySelectorAll('.js-tabs').forEach(function (wrap) {
		var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
		function select(tab, focus) {
			tabs.forEach(function (t) {
				var on = t === tab;
				var panel = document.getElementById(t.getAttribute('aria-controls'));
				t.classList.toggle('is-active', on);
				t.setAttribute('aria-selected', on ? 'true' : 'false');
				t.tabIndex = on ? 0 : -1;
				if (panel) panel.classList.toggle('is-active', on);
			});
			if (focus) tab.focus();
		}
		tabs.forEach(function (tab, i) {
			tab.addEventListener('click', function () { select(tab); });
			tab.addEventListener('keydown', function (e) {
				var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
				if (!d) return;
				e.preventDefault();
				select(tabs[(i + d + tabs.length) % tabs.length], true);
			});
		});
	});

	/*------------------------------------------------------------
		横に流れるカルーセル（コンテンツ一覧・文化シヤッターグループ共通。.js-loopSlider）
		- 各カードに「現在のカードから何枚目か」k を --k で入れ、CSS が left を計算して並べる（ループ）
		  k = 0, ±1 … 表示 ／ ±2 … 40% ／ それ以外 … 非表示（Figma「サービスカルーセル 1013」）
		- 端から反対側へ回り込むカードは、見えない位置（k = ±3）を経由させて、左右どちらもふわっと消える・現れるようにする
		  （2026-10-23 ユーザー指示：左端が回り込むときにパッと消えていたのを、右側と同じフェードに）
		  ・左端（k = -2）が出ていく：さらに左（k = -3、透明）へ 0.5 秒で動かしてから、アニメなしで右の見えない位置へ
		  ・左端へ入ってくる：アニメなしで左の見えない位置（k = -3）に置いてから、0.5 秒で k = -2 へ
		- 前後ボタン・スワイプで 0.5 秒移動。進捗バーは現在の位置
		- data-auto="4000" を付けると 4 秒ごとに自動で次へ（hover・フォーカス中・画面外・タブ非表示では停止）
	------------------------------------------------------------*/
	document.querySelectorAll('.js-loopSlider').forEach(function (slider) {
		var items = Array.prototype.slice.call(slider.querySelectorAll('.slideItem'));
		var n = items.length;
		var bar = slider.querySelector('.slideBar span');
		var current = 0;
		var prevK = [];
		if (bar) bar.style.setProperty('--n', n);
		function kOf(i) {
			// -floor((n-1)/2) 〜 ceil((n-1)/2) の範囲に収める（6枚なら -2〜3）
			var k = ((i - current) % n + n) % n;
			if (k > Math.ceil((n - 1) / 2)) k -= n;
			return k;
		}
		// 位置 k に置く（|k| ≤ 1 は表示、2 は 40%、それ以外は透明）
		function place(item, k) {
			item.style.setProperty('--k', k);
			item.classList.toggle('is-near', Math.abs(k) <= 1);
			item.classList.toggle('is-side', Math.abs(k) === 2);
		}
		// アニメなしで置く（transition を一瞬切って、反映させてから戻す）
		function placeNow(item, k) {
			item.classList.add('no-anim');
			place(item, k);
			void item.offsetWidth;
			item.classList.remove('no-anim');
		}
		function render() {
			items.forEach(function (item, i) {
				var k = kOf(i);
				var pk = prevK[i];
				clearTimeout(item._wrapTimer);
				if (pk === undefined || Math.abs(k - pk) <= 1) {
					item.classList.remove('no-anim');
					place(item, k);
				} else if (k > pk) {
					// 左端から出ていく：左の見えない位置へフェードしながら動かし、終わったら右の見えない位置へ
					place(item, pk - 1);
					item._wrapTimer = setTimeout(function () { placeNow(item, k); }, 500);
				} else {
					// 左端へ入ってくる：左の見えない位置から動かす
					placeNow(item, k - 1);
					place(item, k);
				}
				var link = item.querySelector('a');
				var visible = Math.abs(k) <= 2;
				link.tabIndex = visible ? 0 : -1;
				item.setAttribute('aria-hidden', visible ? 'false' : 'true');
				prevK[i] = k;
			});
			if (bar) bar.style.setProperty('--i', current);
		}
		function go(step) {
			current = (current + step + n) % n;
			render();
			restart();
		}
		slider.querySelector('.slideBtn.prev').addEventListener('click', function () { go(-1); });
		slider.querySelector('.slideBtn.next').addEventListener('click', function () { go(1); });
		var startX = null;
		slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
		slider.addEventListener('touchend', function (e) {
			if (startX === null) return;
			var dx = e.changedTouches[0].clientX - startX;
			if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
			startX = null;
		});

		// 自動で次へ（data-auto がある場合のみ）
		var autoMs = parseInt(slider.getAttribute('data-auto'), 10) || 0;
		var timer = null;
		var hovering = false;
		var inView = false;
		function stop() {
			clearInterval(timer);
			timer = null;
		}
		function restart() {
			stop();
			if (!autoMs || hovering || !inView || document.hidden) return;
			timer = setInterval(function () {
				current = (current + 1) % n;
				render();
			}, autoMs);
		}
		if (autoMs) {
			// スマホはタップで mouseenter が起きて止まったままになるので、hover できる端末だけ
			if (window.matchMedia('(hover: hover)').matches) {
				slider.addEventListener('mouseenter', function () { hovering = true; stop(); });
				slider.addEventListener('mouseleave', function () { hovering = false; restart(); });
			}
			slider.addEventListener('focusin', function () { hovering = true; stop(); });
			slider.addEventListener('focusout', function () { hovering = false; restart(); });
			document.addEventListener('visibilitychange', restart);
			if ('IntersectionObserver' in window) {
				new IntersectionObserver(function (entries) {
					inView = entries[0].isIntersecting;
					restart();
				}).observe(slider);
			} else {
				inView = true;
			}
		}

		render();
		// 最初の配置ではアニメーションさせない
		requestAnimationFrame(function () {
			requestAnimationFrame(function () { slider.classList.add('is-ready'); });
		});
	});

	/*------------------------------------------------------------
		背景エリアの色（スクロール連動。Figma「背景グラデ」1013）
		- 白の濃さ：エリア上端 0.8 → エリア上端から 1305px（Figma の 36.8%）で 1（白ベタ）
		  画面の上端・下端それぞれの位置の濃さを --bg-top / --bg-bottom に入れる
		- 丸く広がる背景（.js-dome）：参考 alvamososaka.com の黄色い丸を計測した動きに合わせる
		  ・形は「楕円の上半分＋中心から下は全面」（円の下端が見えないように）
		    楕円の縦横比は 2026-10-23 カンプ（Frame 769 の Ellipse 21：3116×1799）と同じ 0.577。真円よりカーブが緩やか
		  ・始まり：楕円の頂点（エリアの上端から 400px 下）が画面の下端に来たとき。横幅は画面幅の 1.4 倍で、上部の平たい弧だけが見える
		    （2026-10-23 午後ユーザー指示：始点を画面の左右いっぱいに広がる緩やかな弧に。端から頂点まで画面幅の約 12%。旧：画面幅 74% の丸）
		  ・スクロール量 画面の高さ×2.2 かけて、イーズアウトで横幅 2.6 倍（画面幅比）まで広げながら頂点が画面幅の 91.5% 上へ（頂点の動きは前と同じ）
		  ・円が横幅いっぱいを超えたら、左右の端で円と交わる高さより下を全面にする
		  ・円はエリアの上へはみ出して、前のセクションの後ろまで広がる（.dome は CSS で上へ広げてある）
	------------------------------------------------------------*/
	var gradArea = document.querySelector('.js-gradArea');
	var gradBg = document.querySelector('.js-gradBg');
	var domeArea = document.querySelector('.js-domeArea');
	var dome = document.querySelector('.js-dome');
	var newsSec = document.getElementById('news');
	var DOME_RY = 1799 / 3116; // 楕円の縦の半径 ÷ 横の半径（Figma の Ellipse 21）
	function remPx() {
		return parseFloat(getComputedStyle(document.documentElement).fontSize) || 10;
	}
	function whiteAlpha(y) {
		return 0.8 + 0.2 * Math.min(1, Math.max(0, y / (130.5 * remPx())));
	}
	function updateBg() {
		var vh = window.innerHeight;
		if (gradArea && gradBg) {
			var yTop = -gradArea.getBoundingClientRect().top;
			gradBg.style.setProperty('--bg-top', whiteAlpha(yTop).toFixed(3));
			gradBg.style.setProperty('--bg-bottom', whiteAlpha(yTop + vh).toFixed(3));
		}
		if (domeArea && dome) {
			var rect = dome.getBoundingClientRect();
			var areaTop = domeArea.getBoundingClientRect().top;
			var off = areaTop - rect.top; // .dome の上端からエリアの上端まで（上へ広げた分）
			var w = rect.width;
			var h = rect.height;
			var start = 40 * remPx(); // 円の上端の開始位置：エリアの上端から 400px 下（ユーザー指示）
			var t = Math.min(1, Math.max(0, (vh - areaTop - start) / (vh * 2.2)));
			var e = 1 - Math.pow(1 - t, 2.3);
			// 始点から画面幅より大きい横長の楕円にして、上部の平たい弧だけを見せる（2026-10-23 ユーザー指示）
			// 横の半径 0.7w → 1.3w。始点の弧は左右の端が頂点から画面幅の約 12% 下（0.577 × 0.7 ×（1 − √(1 − (0.5/0.7)²)）≒ 0.121）
			var r = w * (0.7 + 0.6 * e);     // 横の半径
			var ry = r * DOME_RY;            // 縦の半径
			var apex = start - w * 0.915 * e; // 頂点の高さ（エリア上端から）。上がる量は前の円のときと同じ
			var cy = off + apex + ry;         // .dome の座標での楕円の中心
			var path;
			if (r < w / 2) {
				// 楕円が横幅より小さい：楕円の上半分＋その真下の長方形
				path = 'M' + (w / 2 - r) + ',' + cy + ' A' + r + ',' + ry + ' 0 0 1 ' + (w / 2 + r) + ',' + cy +
					' L' + (w / 2 + r) + ',' + h + ' L' + (w / 2 - r) + ',' + h + ' Z';
			} else {
				// 楕円が横幅を超えた：左右の端と楕円が交わる高さから下は全面
				var ys = cy - ry * Math.sqrt(1 - (w / 2 / r) * (w / 2 / r));
				path = 'M0,' + ys + ' A' + r + ',' + ry + ' 0 0 1 ' + w + ',' + ys + ' L' + w + ',' + h + ' L0,' + h + ' Z';
			}
			dome.style.clipPath = 'path("' + path.replace(/(\d+\.\d)\d+/g, '$1') + '")';
			// 色の切替：お知らせの上端が画面の 60% まで来たら #B2D6E8（初回版と同じタイミング。CSS で 1 秒フェード）
			dome.classList.toggle('is-news', !!newsSec && newsSec.getBoundingClientRect().top < vh * 0.6);
		}
	}

	/*------------------------------------------------------------
		ページトップボタンの表示
	------------------------------------------------------------*/
	function togglePageTop() {
		if (!pageTop) return;
		pageTop.classList.toggle('show', window.scrollY > 300);
	}

	var ticking = false;
	function onScroll() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function () {
			toggleCta();
			updateBg();
			togglePageTop();
			ticking = false;
		});
	}
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);
	onScroll();

	/*------------------------------------------------------------
		スクロールアニメーション
		- .js-fade / .js-band / .js-secTtl が画面に入ったら .is-inview を付ける（1回だけ）
		- .js-fadeGroup の中の .js-fade は 0.12 秒ずつ（data-stagger で変更可）遅らせて順番に表示（左から時間差でふわっと）
		- data-trigger="group" のグループは PC ではグループが画面に入った時点でまとめて開始（横並びのカードを左から順に出す）
	------------------------------------------------------------*/
	var isPc = window.matchMedia('(min-width: 897px)').matches;
	var groupTargets = []; // まとめて表示するグループ（PC の横並び。data-trigger="group"）
	document.querySelectorAll('.js-fadeGroup').forEach(function (group) {
		var step = parseFloat(group.getAttribute('data-stagger')) || 0.12;
		var items = group.querySelectorAll('.js-fade');
		// SP で縦積みになるグループ（data-trigger="group"）は、1枚ずつ画面に入ったときに出すので遅延なし
		if (!isPc && group.getAttribute('data-trigger') === 'group') return;
		items.forEach(function (el, i) {
			if (!el.style.getPropertyValue('--delay')) el.style.setProperty('--delay', (i * step) + 's');
		});
		if (isPc && group.getAttribute('data-trigger') === 'group') {
			items.forEach(function (el) { el.classList.add('js-fadeByGroup'); });
			groupTargets.push(group);
		}
	});
	/* 見出しの帯の長さを文字の長さに合わせる（上の青＝英字、下の紺＝日本語。左端から文字の右端まで） */
	var secTtls = document.querySelectorAll('.js-secTtl');
	function setSecTtlBars() {
		secTtls.forEach(function (ttl) {
			var en = ttl.querySelector('.en');
			var ja = ttl.querySelector('.ja');
			var left = ttl.getBoundingClientRect().left;
			if (en) ttl.style.setProperty('--bar-top-w', textRight(en) - left + 'px');
			if (ja) ttl.style.setProperty('--bar-bottom-w', textRight(ja) - left + 'px');
		});
	}
	// ブロック要素の幅ではなく、文字そのものの右端
	function textRight(el) {
		var range = document.createRange();
		range.selectNodeContents(el);
		return range.getBoundingClientRect().right;
	}
	setSecTtlBars();
	window.addEventListener('resize', setSecTtlBars, { passive: true });
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(setSecTtlBars);

	var targets = document.querySelectorAll('.js-fade:not(.js-fadeByGroup), .js-band, .js-secTtl');
	if ('IntersectionObserver' in window) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var el = entry.target;
				if (el.classList.contains('js-fadeGroup')) {
					// グループが画面に入ったら、中の要素を左から順に（--delay の時間差で）表示
					el.querySelectorAll('.js-fade').forEach(function (item) { item.classList.add('is-inview'); });
				} else {
					el.classList.add('is-inview');
				}
				io.unobserve(el);
			});
		}, { rootMargin: '0px 0px -15% 0px' });
		targets.forEach(function (el) { io.observe(el); });
		groupTargets.forEach(function (el) { io.observe(el); });
	} else {
		document.querySelectorAll('.js-fade, .js-band, .js-secTtl').forEach(function (el) { el.classList.add('is-inview'); });
	}
})();
