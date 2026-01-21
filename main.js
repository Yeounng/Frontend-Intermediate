//mobile menu expander
const mobileMenuButton = document.querySelector(".mobile-menu");
const overlay = document.querySelector(".overlay");

mobileMenuButton.addEventListener("click", (e) => {
  const isExpanded = e.currentTarget.getAttribute("aria-expanded") === "true";
  e.currentTarget.setAttribute("aria-expanded", !isExpanded);
  const mobileMenu = document.getElementById("gnb-menu");
  mobileMenu.classList.toggle("expand");
  overlay.classList.toggle("active");
});
//expander end

//popup cart start
const cartButton = document.querySelector(".nav-add-cart");
const cartPopup = document.getElementById("cart-popup");
const itemName = document.querySelector(".item-name");
cartButton.addEventListener("click", (e) => {
  const isExpanded = e.currentTarget.getAttribute("aria-expanded") === "true";
  e.currentTarget.setAttribute("aria-expanded", !isExpanded);
  cartPopup.classList.toggle("active");
});

function ariaHiddenState() {
  const emptyMsg = document.querySelector(".cart-empty");
  const isEmpty = emptyMsg.getAttribute("aria-hidden") === "false"; //기본상태 aria 값
  emptyMsg.setAttribute("aria-hidden", isEmpty); //숨겨지지 않은 상태 false가 맞으므로 isEmpty가 true 이기 때문에 !isEmpty가 아니다
  const itemCart = document.querySelector(".popup-main");
  const hasItem = itemCart.getAttribute("aria-hidden") === "true";
  itemCart.setAttribute("aria-hidden", !hasItem);
}

const deleteCart = document.querySelector(".discard-item");

deleteCart.addEventListener("click", (e) => {
  itemName.textContent = "";
  cartPopup.classList.remove("has-item");
  cartButton.classList.remove("has-item");
  count = 0; // 카트를 비울때 수량값을 0으로 초기화
  cartButton.style.setProperty("--cart-quantity", `"${count}"`);
  ariaHiddenState();
});

//popup cart end

//add cart start
const addCart = document.querySelector(".add-cart");

addCart.addEventListener("click", () => {
  const productName = document.querySelector(".product-title").dataset.productName;
  itemName.textContent = productName;
  cartPopup.classList.add("has-item");
  cartButton.classList.add("has-item");
  updateTotal();
  ariaHiddenState();
});

const plus = document.querySelector(".add");
const subtract = document.querySelector(".subtract");
const quantityDisplay = document.querySelector("#quantity");

plus.addEventListener("click", () => {
  quantity++;
  quantityDisplay.textContent = `${quantity}`;
});
subtract.addEventListener("click", () => {
  if (quantity > 0) {
    quantity--;
    quantityDisplay.textContent = `${quantity}`;
  }
});
//add cart end

//price updator start
let itemPrice = document.querySelector("#final-price").dataset.finalPrice;
let quantity = 0;
let count = 0;
function updateTotal() {
  count = count + quantity;
  if (count === 0) return;
  let cartPrice = document.querySelector(".item-total");
  cartButton.style.setProperty("--cart-quantity", `"${count}"`);
  cartPrice.innerHTML = `$${itemPrice} x ${count} <strong>$${itemPrice * count}</strong>`;
}
//price updator end

//swiper start

function createHouseMadeSwiper(containerSelector) {
  const container = document.querySelector(containerSelector);

  const swiperContainer = container.querySelector(".product-swiper");
  const swiperWrapper = container.querySelector(".swiper-wrapper");
  const prevBtn = container.querySelector(".swiper-left");
  const nextBtn = container.querySelector(".swiper-right");

  const sliderItem = container.querySelectorAll(".slider-item");
  const totalSlide = sliderItem.length - 1; //lenght 는 4, index는 0 1 2 3
  let currentIdx = 0;

  const galleryImg = container.querySelectorAll(".gallery-img li");
  galleryImg[currentIdx].classList.add("active");

  galleryImg.forEach((elem, index) => {
    elem.addEventListener("click", (e) => {
      galleryImg[currentIdx].classList.remove("active");
      currentIdx = index;
      slideUpdator();
      galleryImg[currentIdx].classList.add("active");
    });
  });

  window.addEventListener("resize", () => {
    const swiperWidth = swiperContainer.clientWidth;
    const offset = -(currentIdx * swiperWidth);
    if (currentIdx > 0 && offset < 0) {
      slideUpdator();
    }
  });

  const slideUpdator = () => {
    const swiperWidth = swiperContainer.clientWidth;
    const offset = -(currentIdx * swiperWidth); //offset 값 자체가 slider의 포지션.
    swiperWrapper.style.transform = `translateX(${offset}px)`;
    //값을 더하고 빼는게 아니라 1번 slider 위치 0px 2번 슬라이더의 위치 -480px 3번 슬라이더의 위치 -960px 같은식
  };

  nextBtn.addEventListener("click", () => {
    if (currentIdx < totalSlide) {
      galleryImg[currentIdx].classList.remove("active");
      currentIdx++;
      slideUpdator();
      galleryImg[currentIdx].classList.add("active");
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentIdx > 0) {
      galleryImg[currentIdx].classList.remove("active");
      currentIdx--;
      slideUpdator();
      galleryImg[currentIdx].classList.add("active");
    }
  });
}

createHouseMadeSwiper(".lightbox .product-showcase");
createHouseMadeSwiper(".product-page .product-showcase");
//swiper end

//lightbox start
const showcase = document.querySelector(".product-page .swiper-wrapper");

showcase.addEventListener("click", () => {
  lightbox.classList.add("active");
});

const lightbox = document.querySelector(".lightbox");
const closeButton = document.querySelector(".lightbox-close");
closeButton.addEventListener("click", () => {
  lightbox.classList.remove("active");
});
//lightbox end
