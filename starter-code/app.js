let quizData;

const list = document.querySelector(".answer-list");
const buttonSubmit = document.querySelector(".submit");
const progressBar = document.querySelector(".progression-bar");

let questionIndex = 0;
let totalQ = 0;
let score = 0;

async function getData() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok)
      throw new Error("An error occured while trying to retrieveing the data");

    quizData = await response.json();

    console.log(quizData);

    quizMenuRender();
  } catch (error) {
    console.log("An error occured!", error);
  }
}

//cards in animation
let motionIn = {
  opacity: [0, 0.3, 1],
  transform: ["translate(100px, 0)", "translate(60px, 0)", "translate(0, 0)"],
};

let fadeIn = {
  opacity: [0, 1],
};

let options = {
  duration: 700,
  fill: "backwards",
  easing: "ease-in",
};
/*
브라우저 동작 순서
1.DOM / CSSOM 계산
2.스타일 계산 (Style Resolve) <- fill 은 이때 동작
3.레이아웃
4.페인트
5.컴포지팅
forwards는 애니메이션 시작 전에 대해 아무런 스타일 제공 X 끝난 후의 상태만 정의 => 2.스타일 계산 단계에서 적용하는 style = css value 로 애니메이션이 튀어보임
backwards는 애니메이션 시작 전이라도 2.스타일 계산 단계에서 애니메이션 스타일을 포함. 첫 키프레임 값을 스타일 계산시점에 적용.*/

getData();

function quizMenuRender() {
  list.innerHTML = "";
  quizData.quizzes.forEach((item, index) => {
    listGen(item);
    const currentItem = list.children[index]; //forEach에서 생성된 현재 li 호출용
    currentItem.animate(motionIn, { ...options, delay: index * 150 }); //전개구문. 스프레드연산사 활용해서 기본 ...options 값에 delay추가

    const currentSubject = Number(index);
    currentItem.addEventListener("click", () => {
      quizSubjectRender(currentSubject, questionIndex);
      const appTxt = document.querySelector(".app-text");
      appTxt.textContent = `Question ${questionIndex} out of ${quizData.quizzes[currentSubject].questions.length}`;
    });
  });
}

//quizMenu 생성
function listGen(item) {
  const listHtml = `<img src="${item.icon}" alt="${item.title}" /><span>${item.title}</span>`;
  const listMenu = document.createElement("li");
  listMenu.innerHTML = listHtml; //HTML을 먼저 작성해두고

  list.appendChild(listMenu); //요소를 자식요소로 붙인다
  // list.appendChild(listMenu).innerHTML = listItems;
}

function quizSubjectRender(currentSubject, questionIndex) {
  list.innerHTML = ""; //작동직후 우선 list 내부 HTML 을 초기화

  //selected subject title
  iconColor(currentSubject);

  //Load questionList
  const questionList = quizData.quizzes[currentSubject].questions;

  //Question display
  const currentQ = document.querySelector(".app-title");
  currentQ.textContent = questionList[questionIndex].question;

  //Add progression-bar
  let totalQ = quizData.quizzes[currentSubject].questions.length;
  let progressPercent = (questionIndex / totalQ) * 100;
  progressBar.classList.add("active");
  progressBar.style.setProperty("--progress", `${progressPercent}%`);

  quizAnswerRender(currentSubject, questionIndex);
}

function iconColor(currentSubject) {
  const loadedSubj = document.querySelectorAll(".selected-subject");
  const subjColor = ["#fff5ed", "#e0fdef", "#ebf0ff", "#f6e7ff"];
  loadedSubj.forEach((elem) => {
    elem.innerHTML = `<img src="${quizData.quizzes[currentSubject].icon}" alt="${quizData.quizzes[currentSubject].title}" /><span>${quizData.quizzes[currentSubject].title}</span>`;
    elem.style.setProperty("--icon-bg", `${subjColor[currentSubject]}`);
  });
}

function quizAnswerRender(currentSubject, questionIndex) {
  list.innerHTML = "";
  const answerList =
    quizData.quizzes[currentSubject].questions[questionIndex].options;
  const answer =
    quizData.quizzes[currentSubject].questions[questionIndex].answer;

  answerList.forEach((question, index) => {
    const answerOrder = ["A", "B", "C", "D"];
    const answerHtml = `<div class = "answer-order"><span>${answerOrder[index]}</span></div><span class="answer-value"></span>`;
    const answerList = document.createElement("li");
    answerList.innerHTML = answerHtml;
    answerList.querySelector(".answer-value").textContent = question; // 백팃에 다 넣지않고 따로 분리. 데이터 중에 HTML 태그 모양 등이 있어서 answer-value값만 제외하고 백팃으로 HTML주입 후 querySelector로 찾아서 textContent로 따로 주입

    list.appendChild(answerList);

    const currentItem = list.children[index]; //forEach에서 생성된 현재 li 호출용
    currentItem.animate(motionIn, { ...options, delay: index * 150 });

    currentItem.onclick = () => {
      list
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("clicked")); //ul인 list를 querySelectorAll("li")로 하위 li 요소를 모두 가져오고 forEach로 각각 clicked 클래스가 존재한다면 제거

      currentItem.classList.toggle("clicked");
      const errorMsg = document.querySelector(".error-msg");
      if (errorMsg) {
        errorMsg.remove();
      }
    };

    // currentItem.addEventListener("click", (e) => {
    //   list
    //     .querySelectorAll("li")
    //     .forEach((li) => li.classList.remove("clicked")); //ul인 list를 querySelectorAll("li")로 하위 li 요소를 모두 가져오고 forEach로 각각 clicked 클래스가 존재한다면 제거

    //   currentItem.classList.toggle("clicked");
    //   const errorMsg = document.querySelector(".error-msg");
    //   if (errorMsg) {
    //     errorMsg.remove();
    //   }
    // });
  });
  buttonRender();
  list.appendChild(buttonSubmit);
  buttonSubmit.animate(motionIn, { ...options, delay: 550 });

  // list.addEventListener("click", (e) => {
  //   list.querySelectorAll("li").forEach((li) => {
  //     li.classList.remove("incorrect");

  //     const addedIcon = li.querySelector(".status-icon");
  //     if (addedIcon) addedIcon.remove();
  //   });
  //   if (e.target.classList.contains("submit")) {
  //     answerChecker(answer, currentSubject, questionIndex);
  //   }
  // });
  buttonSubmit.onclick = (e) => {
    list.querySelectorAll("li").forEach((li) => {
      li.classList.remove("incorrect");

      const addedIcon = li.querySelector(".status-icon");
      if (addedIcon) addedIcon.remove();
    });
    answerChecker(answer, currentSubject, questionIndex);
  };
}
function answerChecker(answer, currentSubject, questionIndex) {
  const clickedItem = list.querySelector("li.clicked");
  const errorMsg = document.querySelector(".error-msg");

  if (!clickedItem) {
    if (!errorMsg) {
      // const nothing = document.createElement("div");
      // const nothingHtml = `<img src="./assets/images/icon-incorrect.svg"><span>Please Select an Answer</span>`;
      // nothing.innerHTML = nothingHtml;
      // list.appendChild(nothing);
      // 기존 코드 -> 아래 코드로 변경. 추가할 HTML을 미리 작성해두고 insertAdjacentHTML로 위치를 지정해서 HTML을 그대로 넣어버림. 값이 고정이라면 좋다
      const nothingHtml = `<div class="error-msg"><img src="./assets/images/icon-incorrect.svg"><span>Please Select an Answer</span></div>`;
      list.insertAdjacentHTML("beforeend", nothingHtml);
    }

    return;
  }

  const selected = clickedItem.querySelector(".answer-value").textContent;

  if (selected === answer) {
    correctIcon(clickedItem);
    score++;
  } else {
    incorrectIcon(clickedItem);
  }
  questionIndex++;
  console.log(questionIndex);

  if (questionIndex === 10) {
    completeDP(score, currentSubject, questionIndex);

    return;
  } else {
    setTimeout(() => {
      quizSubjectRender(currentSubject, questionIndex);
    }, 1000);
  }
}

function completeDP(score, currentSubject, questionIndex) {
  const endingTitle = document.querySelector(".app-title");
  const appText = document.querySelector(".app-text");
  appText.remove();
  progressBar.remove();

  endingTitle.innerHTML =
    "<span>Quiz Completed</span><br/><strong>You Scored...</strong>";
  list.innerHTML = `<div class="ending-screen"><div class="selected-subject"><img src="${quizData.quizzes[currentSubject].icon}" alt="${quizData.quizzes[currentSubject].title}" /><span>${quizData.quizzes[currentSubject].title}</span></div><strong>${score}</strong><span>out of ${questionIndex}<span></div>`;
  iconColor(currentSubject);
  buttonRender();
  buttonSubmit.textContent = "Play Again";
  list.appendChild(buttonSubmit);

  buttonSubmit.onclick = (e) => {
    location.reload();
  };

  const modeSwitch = document.getElementById("mode-switch");
  let isChecked = modeSwitch.checked;
  const edScreen = document.querySelector(".ending-screen");

  if (isChecked) {
    edScreen.classList.add("theme-dark");
  }

  modeSwitch.onclick = (e) => {
    let isChecked = modeSwitch.checked;
    if (!isChecked) {
      edScreen.classList.remove("theme-dark");
    } else if (isChecked) {
      edScreen.classList.add("theme-dark");
    }
  };
}

function correctIcon(clickedItem) {
  const modeSwitch = document.getElementById("mode-switch");
  let isChecked = modeSwitch.checked;

  clickedItem.classList.add("correct");
  let cMark = `<img class="status-icon" src="./assets/images/icon-correct.svg" alt=""/>`;
  if (isChecked) {
    let cMarkDark = `<img class="status-icon theme-dark" src="./assets/images/icon-correct.svg" alt=""/>`;
    clickedItem.insertAdjacentHTML("beforeend", cMarkDark);
  } else if (!isChecked) {
    clickedItem.insertAdjacentHTML("beforeend", cMark);
  }
}

function incorrectIcon(clickedItem) {
  const modeSwitch = document.getElementById("mode-switch");
  let isChecked = modeSwitch.checked;

  clickedItem.classList.add("incorrect");
  let cMark = `<img class="status-icon" src="./assets/images/icon-incorrect.svg" alt=""/>`;
  if (isChecked) {
    let cMarkDark = `<img class="status-icon theme-dark" src="./assets/images/icon-incorrect.svg" alt=""/>`;
    clickedItem.insertAdjacentHTML("beforeend", cMarkDark);
  } else if (!isChecked) {
    clickedItem.insertAdjacentHTML("beforeend", cMark);
  }
}

function buttonRender() {
  buttonSubmit.textContent = "Submit Answer";
  buttonSubmit.classList.add("active");
}
themeSwicth();
function themeSwicth() {
  const modeSwitch = document.getElementById("mode-switch");

  modeSwitch.addEventListener("change", (e) => {
    const bodyBG = document.querySelector("body");
    const appMain = document.querySelector(".container");
    const iconSun = document.querySelector(".icon-sun");
    const iconMoon = document.querySelector(".icon-moon");
    const progressBar = document.querySelector(".progression-bar");

    let isChecked = modeSwitch.checked;

    if (!isChecked) {
      bodyBG.classList.remove("theme-dark");
      appMain.classList.remove("theme-dark");
      list.classList.remove("theme-dark");
      iconSun.src = "./assets/images/icon-sun-dark.svg";
      iconMoon.src = "./assets/images/icon-moon-dark.svg";
      if (progressBar) {
        progressBar.classList.remove("theme-dark");
      }
    } else if (isChecked) {
      bodyBG.classList.add("theme-dark");
      appMain.classList.add("theme-dark");
      list.classList.add("theme-dark");
      iconSun.src = "./assets/images/icon-sun-light.svg";
      iconMoon.src = "./assets/images/icon-moon-light.svg";
      if (progressBar) {
        progressBar.classList.add("theme-dark");
      }
    }
  });
}
