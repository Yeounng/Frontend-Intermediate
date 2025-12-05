const inputSlider = document.getElementById("slider");
const inputValue = document.querySelector(".length");
const generate = document.querySelector(".generate");
const dochigogo = document.querySelector(".p-gen-result>span");
const Clipboard = new ClipboardJS(".btn-copy");

const charSet = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  symbols: "`~!@#$%^&*()_+,./",
  numbers: "012345678",
};

const strength = document.querySelector(".strength");
let conditions = [];
let pwLength = inputSlider.value;

let pwOutput = [];
let finalOutput;

let finalCounts = {
  lowercase: 0,
  uppercase: 0,
  numbers: 0,
  symbols: 0,
};

const sliderMin = 8;
const sliderMax = 32;

function sliderBackground() {
  let sliderPosPercent =
    ((pwLength - sliderMin) / (sliderMax - sliderMin)) * 100; //slider thumb의 상대적위치 % 슬라이더값 - 최솟값 / (슬라이더가 이동 가능한 전체 크기(24칸) Max - Min )
  return (inputSlider.style.background = `linear-gradient(90deg, #a4ffaf 0% ${sliderPosPercent}%, #14131b ${sliderPosPercent}% 100%)`);
}

sliderBackground();

function initializer() {
  //초기값 설정. generate버튼 클릭시 값을 초기화
  finalCounts = {
    lowercase: 0,
    uppercase: 0,
    numbers: 0,
    symbols: 0,
  };
  conditions = [];
  finalOutput;
  pwOutput = [];
}

const checkboxes = document.querySelectorAll('input[type="checkbox"]'); //조건 체크 수에 따라 난이도 표시
checkboxes.forEach((cb) => {
  //각각 checkbox를 forEach로 순회하며 체크되었을경우 conditions 배열에 difficulty 항목 추가/제거
  cb.addEventListener("change", (e) => {
    if (e.target.checked) {
      conditions.push("difficulty");
      difficulty();
    } else if (!e.target.checked) {
      conditions.pop();
      difficulty();
    }
  });
});

const level = document.querySelectorAll(".strength-level");

function difficulty() {
  level.forEach((val) => {
    if (val.classList.contains("active")) {
      val.classList.remove("active");
    }
  });
  if (conditions.length <= 1) {
    strength.textContent = "WEAK";
  }
  if (conditions.length >= 2) {
    strength.textContent = "MEDIUM";
  }
  if (conditions.length >= 3) {
    strength.textContent = "STRONG";
  }
  if (conditions.length >= 4) {
    strength.textContent = "EXCELLENT";
  }
  for (let i = 0; i < conditions.length; i++) {
    level[i].classList.add("active");
  }
}

inputSlider.addEventListener("input", (e) => {
  //input 슬라이더 값에따라 슬라이더 배경, 값 변경. 이후 사용될 pwLength에 값 입력
  inputValue.textContent = e.target.value;
  pwLength = parseInt(inputValue.textContent);
  sliderBackground(pwLength);
  console.log(pwLength);
});

generate.addEventListener("click", (e) => {
  initializer();
  allocationGacha(pwLength);
  conditions.forEach((type) => {
    const stringSet = charSet[type];

    const counts = finalCounts[type];
    for (i = 0; i < counts; i++) {
      pwOutput.push(getRandomChar(stringSet));
    }
  });
  finalOutput = shuffleArray(pwOutput).join("");

  dochigogo.textContent = finalOutput;

  if (conditions.length === 0) {
    dochigogo.textContent = "Select at least one option!";

    return finalCounts;
  }
});

// const btnCopy = document.querySelector(".btn-copy");

function allocationGacha(pwLength) {
  //조건에 해당되는 문자를 서로 몇자리씩 나눠가질것인가
  if (document.getElementById("lowercase").checked) {
    // conditions 배열에 조건 여부를 해당 조건을 뜻하는 문자열을 입력시켜서 확인할때 씀
    conditions.push("lowercase");
  }
  if (document.getElementById("uppercase").checked) {
    conditions.push("uppercase");
  }
  if (document.getElementById("numbers").checked) {
    conditions.push("numbers");
  }
  if (document.getElementById("symbols").checked) {
    conditions.push("symbols");
  }

  if (conditions.length === 0) {
    //일치하는 조건이 없다면 그대로 return 시키고 함수 종료
    return finalCounts;
  }

  let minGacha = 0;
  conditions.forEach((type) => {
    //확률상 특정 값이 0이 나올수도 있기때문에 조건 일치하는 값은 우선 1씩 더해준다(최소 한자리 확보)
    finalCounts[type]++;
    minGacha++;
  });

  let remainGacha = pwLength - minGacha; //최소 한자리(1)를 더해줬으므로 그 값만큼 pwLength에서 미리 제거

  for (let i = 0; i < remainGacha; i++) {
    //뽑기 가쟈잇
    let gachaIndex = Math.floor(Math.random() * conditions.length); //조건은 총 4개. 랜덤으로 1,2,3,4를 뽑게끔 설정하고 index값에 저장
    let gachaType = conditions[gachaIndex]; //랜덤으로 나온 인덱스에 일치하는 객체 값에 ++
    finalCounts[gachaType]++;
  }
  return finalCounts;
}

function getRandomChar(stringSet) {
  let result = stringSet.charAt(Math.floor(Math.random() * stringSet.length));

  return result;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
