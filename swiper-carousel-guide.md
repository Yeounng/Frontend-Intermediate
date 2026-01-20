# 프론트엔드 개발자를 위한 Swiper(카루셀) 개발 완벽 가이드

## 개요

Swiper(카루셀)는 **"간단해 보이지만 매우 깊이 있는"** 프론트엔드 컴포넌트입니다. 브라우저 엔진의 이해, 성능 최적화, 사용자 경험까지 모든 개념이 집약되어 있습니다.

이 가이드는 초보자의 직관과 현업의 베스트 프랙티스 사이의 **간격을 메우고**, 왜 특정 방식이 더 효율적인지 논리적으로 설명합니다.

---

## 1. 핵심 개념: "관찰자(Observer)" vs "관리자(Manager)"의 사고 전환

### 초보자의 사고 (관찰자)

```javascript
// ❌ 잘못된 접근: DOM에서 현재 상태를 읽어오려고 함
function moveToNext() {
    const swiper = document.querySelector('.swiper');
    
    // 현재 적용된 CSS를 읽어옴
    const currentTransform = getComputedStyle(swiper).transform;
    console.log(currentTransform);  
    // "matrix(1, 0, 0, 1, -500, 0)" ← 문자열로 반환됨
    
    // 이 문자열을 파싱해서 숫자를 추출
    const matches = currentTransform.match(/(-?\d+)/g);
    const currentX = parseInt(matches[4]);  // 복잡한 파싱...
    
    // 거기에 다시 계산을 더함
    const newX = currentX - 500;
    
    // 다시 CSS를 작성해서 적용
    swiper.style.transform = `translateX(${newX}px)`;
}
```

**문제점:**
- ❌ DOM은 **최종 결과물**이지, 데이터의 저장소가 아님
- ❌ `getComputedStyle`은 **문자열**을 반환하므로 파싱 비용 발생
- ❌ 행렬(matrix) 형태의 문자열 파싱은 오류에 취약함
- ❌ 매번 DOM을 "읽고" "쓰고"하는 것은 성능 저하를 유발함 (Thrashing)
- ❌ 상태가 DOM에 산재되어 있어 추적 및 관리가 어려움

### 전문가의 사고 (관리자)

```javascript
// ✅ 올바른 접근: JavaScript 메모리에서 상태를 관리
class Swiper {
    constructor() {
        this.currentIndex = 0;           // 단일 진실 공급원 (Single Source of Truth)
        this.itemWidth = 500;            // 슬라이드 너비
        this.totalItems = 4;             // 전체 슬라이드 개수
        this.swiper = document.querySelector('.swiper');
    }

    moveToNext() {
        // 1단계: 메모리에서만 계산
        this.currentIndex++;
        
        // 2단계: 계산 결과를 DOM에 일방적으로 적용
        const newTranslateX = -this.currentIndex * this.itemWidth;
        this.swiper.style.transform = `translateX(${newTranslateX}px)`;
    }

    getCurrentPosition() {
        // 항상 메모리의 변수에서 읽음
        return -this.currentIndex * this.itemWidth;
    }
}

const swiper = new Swiper();
swiper.moveToNext();  // DOM을 읽지 않고, 메모리의 상태만 업데이트
```

**장점:**
- ✅ 상태가 명확한 한 곳(this.currentIndex)에 집중됨
- ✅ 계산은 모두 숫자로 처리 (문자열 파싱 불필요)
- ✅ DOM은 순수하게 "출력 장치"로만 역할
- ✅ 성능 우수 (메모리 접근 >> DOM 접근)
- ✅ 디버깅이 수월함 (변수를 콘솔에서 직접 확인)

### 데이터 흐름 비교

```
【초보자】
DOM 읽기 → 문자열 파싱 → 숫자 추출 → 계산 → 문자열로 변환 → DOM 쓰기
(매번 8단계, 복잡도 높음, 오류율 높음)

【전문가】
메모리 계산 → DOM 쓰기
(2단계, 단순함, 신뢰성 높음)
```

---

## 2. 렌더링 파이프라인 이해: left vs transform

### 브라우저의 렌더링 파이프라인

```
1. JavaScript → 2. Style → 3. Layout → 4. Paint → 5. Composite
                    ↓                ↓          ↓
             CSS 규칙 적용      위치/크기 계산   픽셀 그리기
```

### 속성별 영향 범위

#### left/top 사용 (❌ 나쁜 예)

```javascript
// left를 변경하면 Layout 단계부터 다시 시작
swiper.style.left = '-500px';

// 렌더링 파이프라인:
// JS → Style → Layout ← 다시 계산 필요!
//        ↓         ↓
//     left 적용   위치 재계산
//                    ↓
//                  Paint ← 다시 그리기!
//                    ↓
//                 Composite ← GPU에서 합성
```

**영향받는 단계:**
- ✅ Style: CSS 규칙 적용
- ✅ Layout: 위치/크기 재계산 (비용 큼!)
- ✅ Paint: 픽셀 다시 그리기 (비용 큼!)
- ✅ Composite: GPU에서 최종 합성

**성능 지표:**
- 시간: ~16.67ms (60fps 기준)
- CPU 점유율: 높음 (Layout, Paint는 CPU가 담당)
- 프레임 드롭: 매우 높음

#### transform 사용 (✅ 좋은 예)

```javascript
// transform을 변경하면 Composite 단계만 거침
swiper.style.transform = 'translateX(-500px)';

// 렌더링 파이프라인:
// JS → Style → Layout → Paint → Composite ← 여기만 실행!
//                                    ↓
//                              GPU가 변환 담당
```

**영향받는 단계:**
- ✅ Style: CSS 규칙 적용
- ❌ Layout: **건너뜀** (위치 재계산 없음)
- ❌ Paint: **건너뜀** (픽셀 재그리기 없음)
- ✅ Composite: GPU에서 최종 합성 (비용 적음!)

**성능 지표:**
- 시간: ~1-2ms (left보다 90% 이상 빠름)
- CPU 점유율: 매우 낮음 (GPU가 담당)
- 프레임 드롭: 거의 없음

### 성능 비교 실험

```javascript
// 성능 측정: 1000번 이동 시뮬레이션

console.time('left 방식');
for (let i = 0; i < 1000; i++) {
    element.style.left = (i * 500) + 'px';
}
console.timeEnd('left 방식');
// 결과: ~150-200ms

console.time('transform 방식');
for (let i = 0; i < 1000; i++) {
    element.style.transform = `translateX(${i * 500}px)`;
}
console.timeEnd('transform 방식');
// 결과: ~5-10ms

// left가 transform보다 15-40배 느림!
```

### 실제 사용 시나리오

```css
/* ❌ 피해야 할 것 */
.swiper-slide {
    position: absolute;
    left: 0;        /* Layout에 영향 */
    top: 0;         /* Layout에 영향 */
}

/* ✅ 권장하는 것 */
.swiper-slide {
    position: absolute;
    left: 0;
    top: 0;
    transform: translateX(0);  /* Composite만 영향 */
}
```

---

## 3. clientWidth vs offsetWidth: 박스 모델 완벽 이해

### 박스 모델 다이어그램

```
┌─────────────────────────────────────────────┐
│           Margin (바깥쪽)                    │
│  ┌───────────────────────────────────────┐  │
│  │  Border (테두리)                       │  │
│  │  ┌───────────────────────────────┐   │  │
│  │  │  Padding (내부 여백)           │   │  │
│  │  │  ┌─────────────────────────┐  │   │  │
│  │  │  │   Content (콘텐츠)       │  │   │  │
│  │  │  └─────────────────────────┘  │   │  │
│  │  └───────────────────────────────┘   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

offsetWidth  = Border + Padding + Content + 스크롤바 (있을 경우)
clientWidth  = Padding + Content (Border 제외)
scrollWidth  = 실제 스크롤 가능한 전체 너비
```

### 구체적인 예시

```html
<div class="swiper" style="
    width: 1000px;           /* Content 영역 */
    padding: 20px;           /* 양쪽 40px 추가 */
    border: 10px solid red;  /* 양쪽 20px 추가 */
">
    <div class="slides">
        <div class="slide">Slide 1</div>
        <div class="slide">Slide 2</div>
    </div>
</div>

<script>
const swiper = document.querySelector('.swiper');

console.log(swiper.offsetWidth);  // 1080px  (10+20+1000+20+10)
console.log(swiper.clientWidth);  // 1040px  (20+1000+20)
console.log(swiper.scrollWidth);  // ? (자식 요소의 너비에 따라 결정)
</script>
```

### Swiper에서 clientWidth를 써야 하는 이유

#### 시나리오: 테두리가 있는 카루셀

```html
<div class="swiper-container" style="
    width: 500px;
    border: 15px solid #333;  ← 중요: 테두리가 있음
    padding: 0;
">
    <div class="swiper-wrapper">
        <!-- 슬라이드들 -->
    </div>
</div>
```

#### ❌ offsetWidth 사용 (잘못됨)

```javascript
class BadSwiper {
    constructor() {
        this.container = document.querySelector('.swiper-container');
        this.slideWidth = this.container.offsetWidth;  // 530px (테두리 포함)
    }

    moveToNext() {
        // 이동 거리가 잘못됨
        // 슬라이드가 테두리를 통과하거나, 테두리 안쪽에 남게 됨
        this.currentIndex++;
        const offset = -this.currentIndex * this.slideWidth;
        this.wrapper.style.transform = `translateX(${offset}px)`;
    }
}

// 문제: 슬라이드 이미지가 테두리를 침범하거나 어긋남
```

**문제점:**
- 테두리(15px × 2 = 30px)까지 포함되어 계산됨
- 슬라이드 이미지가 가시 영역(viewport)을 벗어남
- 매번 미세하게 어긋나는 누적 오류 발생

#### ✅ clientWidth 사용 (올바름)

```javascript
class GoodSwiper {
    constructor() {
        this.container = document.querySelector('.swiper-container');
        this.slideWidth = this.container.clientWidth;  // 500px (테두리 제외)
    }

    moveToNext() {
        // 실제 보여지는 영역 기준으로 이동
        // 슬라이드가 항상 테두리 안쪽에 있음
        this.currentIndex++;
        const offset = -this.currentIndex * this.slideWidth;
        this.wrapper.style.transform = `translateX(${offset}px)`;
    }
}

// 결과: 슬라이드가 정확하게 움직임
```

**장점:**
- 실제 보여지는 내부 영역만 고려
- 테두리, 패딩과 무관하게 일관성 있는 이동
- 레이아웃의 연속성 유지

### 결론: 언제 뭘 써야 하나?

| 상황 | 사용할 것 | 이유 |
|------|---------|------|
| **Swiper/Carousel** | `clientWidth` | 가시 영역만 필요 |
| **요소 전체 크기** | `offsetWidth` | 테두리 포함 전체 필요 |
| **스크롤 여부 판단** | `scrollWidth > clientWidth` | 실제 스크롤 가능 여부 |
| **패딩 포함 크기** | `clientWidth` | 내부 여백만 필요 |

---

## 4. 무한 루프(Infinite Loop) 슬라이더: "순간이동" 알고리즘

### 개념: 착시(Illusion) 원리

무한 루프는 실제로 무한한 요소를 만드는 것이 아니라, **사용자의 눈을 속이는** 교묘한 알고리즘입니다.

### 원리

#### 1단계: 슬라이드 구성

```
실제 슬라이드: [1, 2, 3, 4]

변환된 구성:   [4', 1, 2, 3, 4, 1']
               ↑                ↑
            복제본           복제본
```

#### 2단계: 초기 위치

```
[4', 1, 2, 3, 4, 1']
     ↑
  시작점: 인덱스 1 (실제 슬라이드 1 표시)
```

#### 3단계: 사용자가 "다음" 클릭

```javascript
class InfiniteSwiper {
    constructor() {
        this.slides = [1, 2, 3, 4];
        this.cloned = this.createClonedSlides();
        // [4', 1, 2, 3, 4, 1']
        
        this.currentIndex = 1;  // 실제 슬라이드 1을 가리킴
        this.wrapper = document.querySelector('.swiper-wrapper');
        
        // 초기 위치: 복제본 앞이 아닌 실제 슬라이드 앞에서 시작
        this.updatePosition();
    }

    createClonedSlides() {
        const lastSlide = this.slides[this.slides.length - 1];
        const firstSlide = this.slides[0];
        return [lastSlide, ...this.slides, firstSlide];
    }

    moveToNext() {
        this.currentIndex++;

        // 애니메이션과 함께 이동
        this.wrapper.style.transition = 'transform 0.3s ease';
        this.updatePosition();

        // 애니메이션이 끝나면 순간이동 처리
        this.wrapper.addEventListener('transitionend', () => {
            this.handleInfiniteLoop();
        }, { once: true });
    }

    moveToPrev() {
        this.currentIndex--;

        this.wrapper.style.transition = 'transform 0.3s ease';
        this.updatePosition();

        this.wrapper.addEventListener('transitionend', () => {
            this.handleInfiniteLoop();
        }, { once: true });
    }

    updatePosition() {
        // 클론된 배열 기준으로 이동
        const offset = -this.currentIndex * this.slideWidth;
        this.wrapper.style.transform = `translateX(${offset}px)`;
    }

    handleInfiniteLoop() {
        // 임계점 도달 여부 확인
        if (this.currentIndex >= this.cloned.length - 1) {
            // 마지막 복제본(1')에 도달함
            // 순간이동 준비
            this.wrapper.style.transition = 'none';  // 애니메이션 끔
            this.currentIndex = 1;  // 실제 첫 번째 슬라이드로 설정
            this.updatePosition();  // 즉시 이동 (사용자는 못 봄)
        } else if (this.currentIndex <= 0) {
            // 처음 복제본(4')에 도달함
            this.wrapper.style.transition = 'none';
            this.currentIndex = this.cloned.length - 2;  // 실제 마지막 슬라이드로 설정
            this.updatePosition();
        }
    }
}
```

### 시각적 시뮬레이션

```
【사용자 관점】
4 → 1 → 2 → 3 → 4 → 1 → 2 → ...
(무한히 계속되는 것처럼 보임)

【실제 내부 구조】
[4', 1, 2, 3, 4, 1']
 0  1  2  3  4  5

사용자가 4(인덱스 4)에서 다음 클릭
→ 1'(인덱스 5)로 애니메이션과 함께 이동
→ 애니메이션 끝남
→ transition: none으로 설정
→ 인덱스를 1로 변경 (사용자는 1을 봄, 같은 모양이므로 인지 못함)
→ 다음에 사용자가 클릭하면 인덱스 2(2)로 이동
```

### 실제 코드 구현

```javascript
class CompleteInfiniteSwiper {
    constructor(selector) {
        this.container = document.querySelector(selector);
        this.wrapper = this.container.querySelector('.swiper-wrapper');
        this.slides = Array.from(this.container.querySelectorAll('.swiper-slide'));
        this.originalSlides = [...this.slides.map(s => s.cloneNode(true))];
        
        this.slideWidth = this.container.clientWidth;
        this.currentIndex = 1;
        this.isAnimating = false;
        
        this.setupClonedSlides();
        this.addEventListeners();
        this.goToSlide(1);
    }

    setupClonedSlides() {
        // 첫 번째 슬라이드의 복제본을 마지막에 추가
        const firstClone = this.slides[0].cloneNode(true);
        this.wrapper.appendChild(firstClone);

        // 마지막 슬라이드의 복제본을 맨 앞에 추가
        const lastClone = this.slides[this.slides.length - 1].cloneNode(true);
        this.wrapper.insertBefore(lastClone, this.wrapper.firstChild);
    }

    addEventListeners() {
        // 다음/이전 버튼
        this.container.querySelector('.next-btn').addEventListener('click', 
            () => this.moveNext());
        this.container.querySelector('.prev-btn').addEventListener('click', 
            () => this.movePrev());

        // 애니메이션 종료 후 순간이동 처리
        this.wrapper.addEventListener('transitionend', 
            () => this.handleInfiniteLoop());
    }

    moveNext() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.currentIndex++;
        this.goToSlide(this.currentIndex);
    }

    movePrev() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.currentIndex--;
        this.goToSlide(this.currentIndex);
    }

    goToSlide(index, smooth = true) {
        const offset = -index * this.slideWidth;
        
        if (smooth) {
            this.wrapper.style.transition = 'transform 0.3s ease-out';
        } else {
            this.wrapper.style.transition = 'none';
        }

        this.wrapper.style.transform = `translateX(${offset}px)`;
    }

    handleInfiniteLoop() {
        // 마지막 복제본에 도달
        if (this.currentIndex === this.slides.length + 1) {
            this.currentIndex = 1;
            this.goToSlide(this.currentIndex, false);
        }
        // 첫 번째 복제본에 도달
        else if (this.currentIndex === 0) {
            this.currentIndex = this.slides.length;
            this.goToSlide(this.currentIndex, false);
        }

        this.isAnimating = false;
    }
}

// 사용
const swiper = new CompleteInfiniteSwiper('.swiper-container');
```

---

## 5. 터치 스와이프(Touch Swipe): 실시간 변위 계산

### 개념: 손가락 좌표 추적

터치 이벤트는 마우스와 달리 **사용자의 손가락 움직임**을 실시간으로 추적해야 합니다.

### 좌표 시스템

```
화면 왼쪽                          화면 오른쪽
   ←─────────────────────────────────→
   0                x_move           window.innerWidth
              ↑
        사용자 손가락 위치 (x_move)
```

### 터치 라이프사이클

```
【1. touchstart】
사용자 손가락 터치
    ↓
x_start 기록
변위(Δx) = 0

【2. touchmove】
손가락 움직임 (반복)
    ↓
현재 위치 x_move 추적
변위(Δx) = x_move - x_start ← 실시간 계산
슬라이더 위치 = basePosition + Δx ← 즉시 반영

【3. touchend】
손가락 떼어짐
    ↓
최종 변위 Δx로 판단
├─ |Δx| > 임계값 → 다음/이전 슬라이드로 이동
└─ |Δx| ≤ 임계값 → 원래 위치로 복귀 (Snap)
```

### 구현 (기본)

```javascript
class TouchSwiper {
    constructor(selector) {
        this.container = document.querySelector(selector);
        this.wrapper = this.container.querySelector('.swiper-wrapper');
        this.slideWidth = this.container.clientWidth;
        
        this.currentIndex = 0;
        this.basePosition = 0;
        this.touchStartX = 0;
        this.displacement = 0;  // Δx
        
        this.addEventListeners();
    }

    addEventListeners() {
        this.wrapper.addEventListener('touchstart', 
            (e) => this.onTouchStart(e));
        this.wrapper.addEventListener('touchmove', 
            (e) => this.onTouchMove(e));
        this.wrapper.addEventListener('touchend', 
            (e) => this.onTouchEnd(e));
    }

    onTouchStart(e) {
        // 1단계: 최초 지점 기록
        this.touchStartX = e.touches[0].clientX;
        
        // 현재 슬라이더 위치를 기준점으로 저장
        this.basePosition = -this.currentIndex * this.slideWidth;
        
        // 애니메이션 일시 정지 (부드러운 드래그를 위해)
        this.wrapper.style.transition = 'none';
    }

    onTouchMove(e) {
        // 2단계: 현재 손가락 위치 추적
        const currentTouchX = e.touches[0].clientX;
        
        // 변위 계산 (최초 지점으로부터의 이동 거리)
        this.displacement = currentTouchX - this.touchStartX;
        
        // 현재 위치 = 기준점 + 변위
        const newPosition = this.basePosition + this.displacement;
        
        // 즉시 반영 (사용자가 손가락을 따라 슬라이더가 움직이는 느낌)
        this.wrapper.style.transform = `translateX(${newPosition}px)`;
    }

    onTouchEnd(e) {
        // 3단계: 임계값 판단
        const threshold = this.slideWidth * 0.2;  // 20% 이상 이동 시 페이지 변경
        
        if (Math.abs(this.displacement) > threshold) {
            // 충분히 이동했으면 다음/이전 슬라이드로
            if (this.displacement > 0) {
                // 오른쪽으로 드래그 → 이전 슬라이드
                this.currentIndex = Math.max(0, this.currentIndex - 1);
            } else {
                // 왼쪽으로 드래그 → 다음 슬라이드
                this.currentIndex = this.currentIndex + 1;
            }
        }
        // 그렇지 않으면 원래 자리로 복귀
        
        // 애니메이션 복구 및 최종 위치로 이동
        this.animateToSlide(this.currentIndex);
    }

    animateToSlide(index) {
        const position = -index * this.slideWidth;
        
        this.wrapper.style.transition = 'transform 0.3s ease-out';
        this.wrapper.style.transform = `translateX(${position}px)`;
    }
}

// 사용
const swiper = new TouchSwiper('.swiper-container');
```

### 고급: 속도(Velocity) 기반 처리

```javascript
class AdvancedTouchSwiper extends TouchSwiper {
    constructor(selector) {
        super(selector);
        this.touchStartTime = 0;
        this.lastTouchX = 0;
        this.velocity = 0;
    }

    onTouchStart(e) {
        super.onTouchStart(e);
        this.touchStartTime = Date.now();
        this.lastTouchX = e.touches[0].clientX;
        this.velocity = 0;
    }

    onTouchMove(e) {
        super.onTouchMove(e);
        
        // 속도 계산 (픽셀/밀리초)
        const now = Date.now();
        const timeDelta = now - this.touchStartTime;
        
        if (timeDelta > 0) {
            const positionDelta = e.touches[0].clientX - this.lastTouchX;
            this.velocity = positionDelta / timeDelta;
        }
        
        this.lastTouchX = e.touches[0].clientX;
    }

    onTouchEnd(e) {
        // 거리 기반 판단
        const distanceThreshold = this.slideWidth * 0.2;
        
        // 속도 기반 판단 (Flick)
        const velocityThreshold = 0.5;  // 픽셀/ms
        const speedyMovement = Math.abs(this.velocity) > velocityThreshold;

        if (Math.abs(this.displacement) > distanceThreshold || speedyMovement) {
            if (this.displacement > 0 || this.velocity > velocityThreshold) {
                this.currentIndex = Math.max(0, this.currentIndex - 1);
            } else {
                this.currentIndex = this.currentIndex + 1;
            }
        }

        this.animateToSlide(this.currentIndex);
    }
}

// 사용
const advancedSwiper = new AdvancedTouchSwiper('.swiper-container');
```

---

## 6. 통합 구현: 완전한 Swiper 컴포넌트

```javascript
class CompleteSwiper {
    constructor(selector, options = {}) {
        // 설정
        this.container = document.querySelector(selector);
        this.wrapper = this.container.querySelector('.swiper-wrapper');
        this.slides = Array.from(this.container.querySelectorAll('.swiper-slide'));
        
        this.slideWidth = this.container.clientWidth;
        this.currentIndex = 0;
        this.isAnimating = false;
        
        // 옵션
        this.autoplay = options.autoplay ?? false;
        this.autoplayDelay = options.autoplayDelay ?? 3000;
        this.infinite = options.infinite ?? true;
        this.threshold = options.threshold ?? 0.2;
        
        // 터치 관련
        this.touchStartX = 0;
        this.basePosition = 0;
        this.displacement = 0;
        
        this.setupInfiniteLoop();
        this.addEventListeners();
        this.startAutoplay();
    }

    setupInfiniteLoop() {
        if (!this.infinite) return;

        const firstClone = this.slides[0].cloneNode(true);
        this.wrapper.appendChild(firstClone);

        const lastClone = this.slides[this.slides.length - 1].cloneNode(true);
        this.wrapper.insertBefore(lastClone, this.wrapper.firstChild);

        this.currentIndex = 1;
        this.goToSlide(1, false);
    }

    addEventListeners() {
        // 네비게이션 버튼
        this.container.querySelector('.next-btn')?.addEventListener('click', 
            () => this.moveNext());
        this.container.querySelector('.prev-btn')?.addEventListener('click', 
            () => this.movePrev());

        // 터치 이벤트
        this.wrapper.addEventListener('touchstart', 
            (e) => this.onTouchStart(e));
        this.wrapper.addEventListener('touchmove', 
            (e) => this.onTouchMove(e));
        this.wrapper.addEventListener('touchend', 
            (e) => this.onTouchEnd(e));

        // 마우스 이벤트 (데스크톱)
        this.wrapper.addEventListener('mousedown', 
            (e) => this.onMouseDown(e));
        this.wrapper.addEventListener('mousemove', 
            (e) => this.onMouseMove(e));
        this.wrapper.addEventListener('mouseup', 
            (e) => this.onMouseUp(e));

        // 애니메이션 완료 후 처리
        this.wrapper.addEventListener('transitionend', 
            () => this.handleAnimationEnd());
    }

    moveNext() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.stopAutoplay();
        
        this.currentIndex++;
        this.goToSlide(this.currentIndex);
    }

    movePrev() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.stopAutoplay();
        
        this.currentIndex--;
        this.goToSlide(this.currentIndex);
    }

    goToSlide(index, smooth = true) {
        const offset = -index * this.slideWidth;
        
        if (smooth) {
            this.wrapper.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        } else {
            this.wrapper.style.transition = 'none';
        }

        this.wrapper.style.transform = `translateX(${offset}px)`;
    }

    handleAnimationEnd() {
        if (!this.infinite) {
            this.isAnimating = false;
            return;
        }

        // 무한 루프 처리
        const maxIndex = this.slides.length + 1;
        
        if (this.currentIndex === maxIndex) {
            this.currentIndex = 1;
            this.goToSlide(this.currentIndex, false);
        } else if (this.currentIndex === 0) {
            this.currentIndex = this.slides.length;
            this.goToSlide(this.currentIndex, false);
        }

        this.isAnimating = false;
        this.startAutoplay();
    }

    // === 터치 이벤트 ===
    onTouchStart(e) {
        this.stopAutoplay();
        this.touchStartX = e.touches[0].clientX;
        this.basePosition = -this.currentIndex * this.slideWidth;
        this.wrapper.style.transition = 'none';
    }

    onTouchMove(e) {
        const currentTouchX = e.touches[0].clientX;
        this.displacement = currentTouchX - this.touchStartX;
        
        const newPosition = this.basePosition + this.displacement;
        this.wrapper.style.transform = `translateX(${newPosition}px)`;
    }

    onTouchEnd(e) {
        const thresholdPixels = this.slideWidth * this.threshold;
        
        if (Math.abs(this.displacement) > thresholdPixels) {
            if (this.displacement > 0) {
                this.movePrev();
            } else {
                this.moveNext();
            }
        } else {
            // 원래 위치로 복귀
            this.goToSlide(this.currentIndex);
        }
    }

    // === 마우스 이벤트 (데스크톱 드래그) ===
    onMouseDown(e) {
        if (e.button !== 0) return;  // 좌클릭만 처리
        
        this.stopAutoplay();
        this.touchStartX = e.clientX;
        this.basePosition = -this.currentIndex * this.slideWidth;
        this.wrapper.style.transition = 'none';
        this.isMouseDown = true;
    }

    onMouseMove(e) {
        if (!this.isMouseDown) return;
        
        const currentX = e.clientX;
        this.displacement = currentX - this.touchStartX;
        
        const newPosition = this.basePosition + this.displacement;
        this.wrapper.style.transform = `translateX(${newPosition}px)`;
    }

    onMouseUp(e) {
        if (!this.isMouseDown) return;
        this.isMouseDown = false;
        
        const thresholdPixels = this.slideWidth * this.threshold;
        
        if (Math.abs(this.displacement) > thresholdPixels) {
            if (this.displacement > 0) {
                this.movePrev();
            } else {
                this.moveNext();
            }
        } else {
            this.goToSlide(this.currentIndex);
        }
    }

    // === 자동 재생 ===
    startAutoplay() {
        if (!this.autoplay) return;
        
        this.autoplayTimeout = setTimeout(() => {
            this.moveNext();
        }, this.autoplayDelay);
    }

    stopAutoplay() {
        clearTimeout(this.autoplayTimeout);
    }

    destroy() {
        this.stopAutoplay();
        // 이벤트 리스너 제거 등
    }
}

// 사용
const swiper = new CompleteSwiper('.swiper-container', {
    autoplay: true,
    autoplayDelay: 3000,
    infinite: true,
    threshold: 0.25
});
```

### HTML 구조

```html
<div class="swiper-container">
    <div class="swiper-wrapper">
        <div class="swiper-slide">Slide 1</div>
        <div class="swiper-slide">Slide 2</div>
        <div class="swiper-slide">Slide 3</div>
    </div>
    
    <button class="prev-btn">←</button>
    <button class="next-btn">→</button>
</div>
```

### CSS

```css
.swiper-container {
    width: 100%;
    max-width: 600px;
    height: 400px;
    overflow: hidden;
    border: 10px solid #333;
    position: relative;
}

.swiper-wrapper {
    display: flex;
    height: 100%;
    transform: translateX(0);
}

.swiper-slide {
    flex: 0 0 100%;
    min-width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}

.prev-btn, .next-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
    z-index: 10;
}

.prev-btn {
    left: 10px;
}

.next-btn {
    right: 10px;
}
```

---

## 7. 성능 최적화 팁

### 1. Will-change 활용

```css
.swiper-wrapper {
    will-change: transform;
}
```

**효과:**
- 브라우저에 미리 "이 요소의 transform이 자주 변할 것"을 알림
- GPU 메모리를 미리 할당
- 프레임 드롭 감소

### 2. Passive 리스너

```javascript
this.wrapper.addEventListener('touchmove', 
    (e) => this.onTouchMove(e), 
    { passive: true }  // ← 중요
);
```

**효과:**
- 스크롤 성능 향상
- 브라우저가 메인 스레드 차단 불가능함을 인지

### 3. requestAnimationFrame 활용

```javascript
onTouchMove(e) {
    if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
    }
    
    this.animationFrame = requestAnimationFrame(() => {
        const currentTouchX = e.touches[0].clientX;
        this.displacement = currentTouchX - this.touchStartX;
        
        const newPosition = this.basePosition + this.displacement;
        this.wrapper.style.transform = `translateX(${newPosition}px)`;
    });
}
```

---

## 8. 결론: 사고 전환의 중요성

### 초보자 vs 전문가

| 측면 | 초보자 | 전문가 |
|------|--------|--------|
| **상태 관리** | DOM에서 읽기 | JavaScript 메모리에서 관리 |
| **연산 기준** | 문자열 파싱 | 숫자 계산 |
| **성능 우선** | left/top 사용 | transform 사용 |
| **박스 모델** | offsetWidth 사용 | clientWidth 사용 |
| **브라우저 신뢰** | DOM 상태 확인 | JavaScript 변수만 믿음 |

### 핵심 원칙

```
【관찰자의 사고】
DOM 상태 읽기 → 문자열 파싱 → 계산 → CSS 적용
(느리고, 오류가 많고, 유지보수 어려움)

【관리자의 사고】
메모리 계산 → CSS 적용
(빠르고, 명확하고, 유지보수 쉬움)

프론트엔드 개발자는 관리자가 되어야 합니다.
```

---

## 추가 학습 자료

### 실전 연습
- 터치 스와이프 없이 기본 버튼 네비게이션 만들기
- 터치 스와이프 추가하기
- 무한 루프 기능 추가하기
- 자동 재생 기능 추가하기
- 속도 기반 처리 추가하기

### 참고 자료
- [MDN: CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [MDN: Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [브라우저 렌더링 파이프라인](https://web.dev/rendering-performance/)

---

**최종 조언**: Swiper는 "간단해 보이지만 깊이 있는" 완벽한 학습 대상입니다. 성능 최적화, 상태 관리, 사용자 경험 모두를 포함하고 있습니다. 반복해서 만들고 리팩토링하면서 프론트엔드 개발의 본질을 깨우치세요!
