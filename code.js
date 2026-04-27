/**
 * Survival DX: ゼロタップお天気＆予定通知システム
 * カレンダーから情報を取得し、指定のメールアドレス宛に件名だけで通知します。
 */

// --- 設定エリア ---
// 送信先（フィルタリング用のエイリアスアドレス等）
const MY_EMAIL = "your_email+forecast@gmail.com"; 

// メインの予定カレンダーID
const MAIN_CAL_ID = "primary"; 

// 天気情報が入っているカレンダー名の「キーワード」（部分一致）
const WEATHER_CAL_KEYWORD = "Forecast"; 
// ----------------

function sendSurvivalNotification() {
  const now = new Date();
  const hour = now.getHours();
  
  // 朝か夜かで取得対象（今日 or 明日）を切り替え
  let targetDate = new Date();
  let timeLabel = "本日";
  
  if (hour >= 12) {
    targetDate.setDate(now.getDate() + 1);
    timeLabel = "明日";
  }
  
  // 1. 予定の取得
  const events = CalendarApp.getCalendarById(MAIN_CAL_ID).getEventsForDay(targetDate);
  const eventCount = events.length;
  let firstEventTime = "";
  if (eventCount > 0) {
    const start = events[0].getStartTime();
    firstEventTime = `(${start.getHours()}時~)`;
  }

  // 2. 天気（降水量）の取得（部分一致＆複数カレンダー対応）
  const allCals = CalendarApp.getAllCalendars();
  const weatherCals = allCals.filter(cal => cal.getName().includes(WEATHER_CAL_KEYWORD));
  
  let weatherInfo = "天気情報なし";
  let wEvents = [];
  
  weatherCals.forEach(cal => {
    wEvents = wEvents.concat(cal.getEventsForDay(targetDate));
  });

  if (wEvents.length > 0) {
    const rainEvent = wEvents.find(e => e.getTitle().includes("降水") || e.getTitle().includes("雨") || e.getTitle().includes("Rain"));
    if (rainEvent) {
      weatherInfo = rainEvent.getTitle().replace("【予報】", "").replace("[Yahoo]", "").trim();
    } else {
      weatherInfo = "晴れ/曇";
    }
  }

  // 3. 件名の組み立て（極限圧縮）
  let subject = "";
  if (hour < 12) {
    subject = `【${timeLabel}】予定${eventCount}件${firstEventTime}。${weatherInfo}。`;
  } else {
    subject = `【${timeLabel}】お疲れ様です。予定${eventCount}件。${weatherInfo}の見込み。`;
  }

  // 4. 送信（本文は空）
  if (eventCount > 0 || weatherInfo !== "天気情報なし") {
    GmailApp.sendEmail(MY_EMAIL, subject, "");
  }
}

/**
 * トリガー設定用関数
 */
function setupTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  
  ScriptApp.newTrigger('sendSurvivalNotification').timeBased().atHour(6).everyDays(1).create();
  ScriptApp.newTrigger('sendSurvivalNotification').timeBased().atHour(18).everyDays(1).create();
}
