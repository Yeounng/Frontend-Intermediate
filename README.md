# Frontend Thinking Log

> 날짜: 2026-01-21  
> 작업 유형: (기능 추가 / UI 개선 / 리팩터링)

### Screenshot

![](./screenshot%202026-01-21%20220156.png)

### Links

- Solution URL: (https://www.frontendmentor.io/solutions/responsive-e-commerce-page-XoAv9tEmg_)
- Live Site URL: (https://app.netlify.com/projects/jade-dolphin-4cf5ca/overview)

## 1. 프로젝트 진행 과정에서 마주친 문제

**Problem 1 Swiper제작**

swiper를 직접 만들어 보자. 우선 위치를 absolute로 고정시키고 항목은 flex로, shrink를 0으로 하고 버튼을 누르면 너비만큼 translateX시켜서 아이템이 움직이게 하면 되겠다 1.그럼 현재 위치는 어떻게 가져오지?
2.wrapper -> item 구조. 부모의 크기가 곹 item의 크기인데 이 너비는 어떻게 가져오지?
3.trasnform 속성에서 translateX(value) 이 값을 가져올 수 있나??
라는 생각을 했는데 값을 가져오는 부분에서부터 문제가 생겼다.

**Problem 2 Cart UI**

카트를 비우거나 아이템이 추가될때 HTML 구조를 없애고 다시 전부 생성하는건 너무 비효율적인것같다
다른 방법을 찾아보자

**Problem 3 Menu Animation**

네비게이션바에서 gnb-menu 부분. menu에 hover했을때 아래 주황색 바가 생겨야하는데 이걸 nav아래 장식 선과 맞춰야했다. ...? 어라 li menu에 높이가 없네,,,,? 100% 도 안먹네...?

```HTML
<ul id="gnb-menu" class="gnb-menu">
  <li class="menu-item"><a href="">Collections</a></li>
  <li class="menu-item"><a href="">Men</a></li>
  <li class="menu-item"><a href="">Women</a></li>
  <li class="menu-item"><a href="">About</a></li>
  <li class="menu-item"><a href="">Contract</a></li>
</ul>
```

---

## 2. 내가 세운 가설 (어떻게 하면 좋을까?/해결 할 수 있을까?)

**Problem 1 Swiper제작**

**Problem 2 Cart UI**

Empty 상태 일때와 아닐때 두 UI를 겹쳐놓고 상황에 따라 활성화/비활성화 시키기.
막상 처음 든 생각인 HTML 구조를 부수고 새로 만드는건 너무 비효율적이긴 했다.

**Problem 3 Menu Animation**

nav -> gnb-menu -> li식으로 높이를 상속하고 100%높이 기준에서 li의 ::after에 position 설정으로 만들면 되겠다.

## 3. 고민했던 선택지들

- 구현 방법이나 구조가 여러가지 떠올랐을때...

**Problem 1 Swiper제작**

- 선택지 A: 클릭 후 아무 표시 없이 기다리게 둔다.
- 선택지 B: 클릭하면 버튼에 로딩 스피너를 보여준다.
- 선택지 C: 버튼을 비활성화(disabled)한다.

**Problem 2 Cart UI**

- 선택지 A: HTML 구조 부수기 -> 개 노가다. 말이안된다
- 선택지 B: UI 컴포넌트 겹쳐놓고 활성/비활성 시키기 -> A같은 생각이 왜 먼저 떠올랐을까? 배고팠었나보다

**Problem 3 Menu Animation**

---

## 4. 최종 선택과 이유 ⭐️ 어떻게 해결했는가?

- 1. "왜 이 방식을 택했을까?" 생각하기
- 2. "더 좋은 방법이 있을까?" 검토하기
- 3. 실제로 실행해서 성능 측정하기
- 4. AI의 선택이 맞는지 평가하기

**Problem 1 Swiper제작**

1.현재 위치를 getComputedStyle 같은 방법으로 찾아보려고했으나 matrix(a,b,c,d,tx,ty) 같은 값을 반환. 정확하게 원하는 값을 추출해서 사용하는것은 너무 복잡하다 2.부모 크기를 window.getComputedStyle().width 로 가져오긴했는데 500.0px 같은 식이라 활용하기가 불편함

slider-item의 INDEX를 활용
기본 값은 0에서 버튼을 눌러 다음 이미지를 표시하면 -부모크기px 만큼 이동.
0번 이미지라면 0
1번 이미지라면 -480px
2번 이미지라면 -960px같은 식.

아! 그러면 index가 변하면 -(index\*sliderWidth) 로 값을 만들면 되겠다.

0번에서는 줄어들 수 없으니 index > 0, 그리고 아이템 갯수보다 커지면 안되니 index < totalsider(갯수) 로 분기해서 offset 값을 증감하고, .style.transform 을 조작해서 완성.

**Problem 2 Cart UI**

- 선택지 B. empty와 main을 형제로 두고 두 UI 컴포넌트의 상태에 따라 aria-hidden을 적용했다.
- display가 none이 되는데도 aria-hidden이 필요한가에 대해 Gemini :

  **하위 호환성 및 견고함**: 브라우저나 스크린 리더 종류에 따라 display: none만으로는 부족한 경우가 있으며, 명시적인 ARIA 속성은 의도를 분명하게 전달합니다.

  --> **검증 결과** = **False** : display: none만으로 부족한 경우가 있다는 증거는 찾을 수 없음. 다만 개발 의도를 명확히 전달하고 코드 유지보수성을 높이는 효과는 있음.

  **애니메이션 처리**: 만약 opacity나 transform으로 서서히 사라지게 할 경우, 요소가 눈에는 안 보이지만 레이아웃 상에는 남아있어 스크린 리더가 읽는 버그를 방지할 수 있습니다.
  --> **검증 결과** = **TRUE** : 요소가 레이아웃에 잔존. aria-hidden 처리하거나 최종적으로 display:none이여야 함.

```HTML
<div class="popup-upper"><span>Cart</span>
  <div class="cart-empty" aria-hidden="false"><span class="empty">Your Cart is Empty</span></div>
  <div class="popup-main"  aria-hidden="true"></div>
</div>
```

**Problem 3 Menu Animation**

우선 CSS부터 뜯어고쳤다. 꽤나 난잡하게 padding margin 등이 들어있었음.
header에 고정높이 지정. 모바일 기준 적절한 높이를 정하고 position이 fixed이기 때문에 main을 일부 가리기 때문에 body에 padding-top을 줘서 main을 밑으로 내리는 등의 수정. header에는 padding margin을 지정하지 않고 하위 nav가 widht,height를 상속후 간격이 필요하면 padding을 적용하거나 했다.

진짜 원인은 flex align-item에 있었는데 기본값은 stretch로 높이를 늘려서 크기를 가득 채운다.
gnb-menu에 flex, align-item:center 가 적용되어 있었는데 이는 높이를 해제하고 컨텐츠 높이만큼 따로 계산시켜서 중간에 배치시키는 속성이라 gnb-menu > li.menu-item에 height를 설정해도 변화가 없었던 것.
align-item:stretch를 명시해 높이값을 되찾고 li(개별항목)에 flex를 적용해 내부 컨텐츠를 수직 정렬해서 레이아웃을 잡았다. 이후는 ::after로 배치하고 hover 효과만 넣으면 끝. 잘 작동했다.

---

## 6. 실제로 구현하면서 느낀 점

- 생각보다 쉬웠던 점 / 어려웠던 점
- 막혔던 부분은 무엇이었는가?

###

레이아웃 짤때마다 느끼는데 생각과 다르게 매번 막히는 구간이 생긴다(...)
더 많이 만들어 볼 필요가 있다. 만들때마다 조금씩 방식이 다른 느낌이 드는데 좋은 방법으로 통일시켜서 제작하는게 좋겠다.

---

## 7. 다시 한다면 바꾸고 싶은 점 (회고)

- 지금 시점에서 아쉬운 선택은?
- 다음에 비슷한 상황이 오면 어떻게 할까?
- 진작 어떤 기능을 쓸걸
- 너무 복잡하게 생각했더니 역효과가 났다.

### 예시

- 상태 관리 로직을 컴포넌트 밖으로 빼고 싶다.
- 공통 버튼 컴포넌트로 정리해보고 싶다.

---

## 8. 이번 작업을 통해 배운점, 활용한 리소스나 유용한 링크 AI chat 등

[Useful Docs](./swiper-carousel-guide.md)

### 예시

- 사용자에게는 실제 속도보다 **느껴지는 반응**이 더 중요할 수 있다.
