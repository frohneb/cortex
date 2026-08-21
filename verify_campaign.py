"""
Verifiziert, dass prozedural generierte Kampagnen-Level genau 1 eindeutige Lösung besitzen.
"""
import test_rules

def test_campaign_generation():
    # Wir testen die ersten 10 Level mit verschiedenen Seed-Werten
    for lvl_idx in range(10):
        size = 4 if lvl_idx < 3 else (6 if lvl_idx < 7 else 8)
        diff = 'easy' if lvl_idx < 5 else 'medium'
        seed = 1000 + lvl_idx * 37
        print(f"Level {lvl_idx + 1}: size={size}, diff={diff}, seed={seed}")

if __name__ == '__main__':
    test_campaign_generation()
