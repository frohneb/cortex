import unittest
from datetime import datetime, timezone, timedelta

def calculate_streaks(history, today_str=None):
    if not history or not isinstance(history, list):
        return {"currentStreak": 0, "maxStreak": 0}
    
    valid_dates = [d for d in history if isinstance(d, str) and len(d) == 10 and d.count('-') == 2]
    if not valid_dates:
        return {"currentStreak": 0, "maxStreak": 0}
    
    def parse_to_utc_days(d_str):
        y, m, d = map(int, d_str.split('-'))
        dt = datetime(y, m, d, tzinfo=timezone.utc)
        epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
        return (dt - epoch).days
    
    unique_days = sorted(list(set(parse_to_utc_days(d) for d in valid_dates)))
    if not unique_days:
        return {"currentStreak": 0, "maxStreak": 0}
    
    max_streak = 0
    current_run = 0
    prev_day = None
    
    for day in unique_days:
        if prev_day is not None and day == prev_day + 1:
            current_run += 1
        else:
            current_run = 1
        if current_run > max_streak:
            max_streak = current_run
        prev_day = day
    
    if today_str:
        today_day = parse_to_utc_days(today_str)
    else:
        now = datetime.now()
        today_day = parse_to_utc_days(f"{now.year:04d}-{now.month:02d}-{now.day:02d}")
    
    day_set = set(unique_days)
    current_streak = 0
    
    if today_day in day_set:
        check = today_day
        while check in day_set:
            current_streak += 1
            check -= 1
    elif (today_day - 1) in day_set:
        check = today_day - 1
        while check in day_set:
            current_streak += 1
            check -= 1
    else:
        current_streak = 0
        
    return {"currentStreak": current_streak, "maxStreak": max_streak}


class TestStreakCalculation(unittest.TestCase):
    def test_empty_history(self):
        res = calculate_streaks([], "2026-08-21")
        self.assertEqual(res["currentStreak"], 0)
        self.assertEqual(res["maxStreak"], 0)

    def test_single_day_today(self):
        res = calculate_streaks(["2026-08-21"], "2026-08-21")
        self.assertEqual(res["currentStreak"], 1)
        self.assertEqual(res["maxStreak"], 1)

    def test_single_day_yesterday(self):
        res = calculate_streaks(["2026-08-20"], "2026-08-21")
        self.assertEqual(res["currentStreak"], 1)
        self.assertEqual(res["maxStreak"], 1)

    def test_broken_streak(self):
        res = calculate_streaks(["2026-08-19"], "2026-08-21")
        self.assertEqual(res["currentStreak"], 0)
        self.assertEqual(res["maxStreak"], 1)

    def test_consecutive_3_days_including_today(self):
        history = ["2026-08-19", "2026-08-20", "2026-08-21"]
        res = calculate_streaks(history, "2026-08-21")
        self.assertEqual(res["currentStreak"], 3)
        self.assertEqual(res["maxStreak"], 3)

    def test_consecutive_3_days_ending_yesterday(self):
        history = ["2026-08-18", "2026-08-19", "2026-08-20"]
        res = calculate_streaks(history, "2026-08-21")
        self.assertEqual(res["currentStreak"], 3)
        self.assertEqual(res["maxStreak"], 3)

    def test_longer_past_streak(self):
        # 5 days in past, gap, then 2 days ending yesterday
        history = [
            "2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05",
            "2026-08-19", "2026-08-20"
        ]
        res = calculate_streaks(history, "2026-08-21")
        self.assertEqual(res["currentStreak"], 2)
        self.assertEqual(res["maxStreak"], 5)

    def test_year_boundary_streak(self):
        history = ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"]
        res = calculate_streaks(history, "2026-01-02")
        self.assertEqual(res["currentStreak"], 4)
        self.assertEqual(res["maxStreak"], 4)

    def test_duplicates_and_unsorted(self):
        history = ["2026-08-20", "2026-08-19", "2026-08-21", "2026-08-20", "2026-08-21"]
        res = calculate_streaks(history, "2026-08-21")
        self.assertEqual(res["currentStreak"], 3)
        self.assertEqual(res["maxStreak"], 3)

if __name__ == "__main__":
    unittest.main()
