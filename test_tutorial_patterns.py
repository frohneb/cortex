import unittest
from test_rules import TangoBoard, solve_tango, SUN, MOON, EMPTY, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE

class TestTutorialPatterns(unittest.TestCase):
    def test_step_1(self):
        board = TangoBoard(4)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(2, 2, MOON)
        board.set_cell(2, 3, MOON)
        # Target: (0,2)=MOON, (0,3)=MOON, (2,0)=SUN, (2,1)=SUN
        board.set_cell(0, 2, MOON)
        board.set_cell(0, 3, MOON)
        board.set_cell(2, 0, SUN)
        board.set_cell(2, 1, SUN)
        self.assertTrue(board.is_valid_partial())

    def test_step_2(self):
        board = TangoBoard(6)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, MOON)
        board.set_cell(0, 3, SUN)
        board.set_h_edge(0, 4, EDGE_EQUAL)
        # Target: (0,4)=MOON, (0,5)=MOON
        board.set_cell(0, 4, MOON)
        board.set_cell(0, 5, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_3_one_five_rule(self):
        board = TangoBoard(6)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 4, SUN)
        board.set_cell(2, 1, MOON)
        board.set_cell(2, 5, MOON)
        # Target: (0,5)=MOON, (2,0)=SUN
        board.set_cell(0, 5, MOON)
        board.set_cell(2, 0, SUN)
        self.assertTrue(board.is_valid_partial())

    def test_step_4_double_opposite_cascade(self):
        board = TangoBoard(4)
        board.set_cell(0, 0, SUN)
        board.set_h_edge(0, 0, EDGE_OPPOSITE)
        board.set_h_edge(0, 1, EDGE_OPPOSITE)
        # Target: (0,1)=MOON, (0,2)=SUN
        board.set_cell(0, 1, MOON)
        board.set_cell(0, 2, SUN)
        self.assertTrue(board.is_valid_partial())

    def test_step_5_lookahead_lock(self):
        board = TangoBoard(4)
        board.set_cell(0, 2, SUN)
        board.set_h_edge(0, 0, EDGE_EQUAL)
        # Target: (0,0)=MOON, (0,1)=MOON
        board.set_cell(0, 0, MOON)
        board.set_cell(0, 1, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_6_domino_partition(self):
        board = TangoBoard(6)
        board.set_h_edge(0, 0, EDGE_OPPOSITE)
        board.set_h_edge(0, 2, EDGE_OPPOSITE)
        board.set_cell(0, 4, SUN)
        # Target: (0,5)=MOON
        board.set_cell(0, 5, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_7_budget_edge_incompatibility(self):
        board = TangoBoard(6)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, MOON)
        board.set_cell(0, 3, MOON)
        board.set_cell(1, 5, SUN)
        board.set_cell(2, 5, SUN)
        board.set_h_edge(0, 4, EDGE_OPPOSITE)
        # Target: (0,4)=SUN, (0,5)=MOON
        board.set_cell(0, 4, SUN)
        board.set_cell(0, 5, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_8_2d_edge_crossing(self):
        board = TangoBoard(4)
        board.set_cell(0, 0, SUN)
        board.set_h_edge(0, 0, EDGE_EQUAL)
        board.set_v_edge(0, 0, EDGE_OPPOSITE)
        # Target: (0,1)=SUN, (1,0)=MOON
        board.set_cell(0, 1, SUN)
        board.set_cell(1, 0, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_9_edge_doubling_rest(self):
        board = TangoBoard(6)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, MOON)
        board.set_cell(0, 3, MOON)
        # Target: (0,4)=SUN, (0,5)=MOON
        board.set_cell(0, 4, SUN)
        board.set_cell(0, 5, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_10_uniqueness(self):
        board = TangoBoard(6)
        board.grid[0] = [SUN, MOON, SUN, MOON, MOON, SUN]
        board.set_cell(1, 0, SUN)
        board.set_cell(1, 1, MOON)
        board.set_cell(1, 2, SUN)
        board.set_cell(1, 3, MOON)
        # Target: (1,4)=SUN, (1,5)=MOON
        board.set_cell(1, 4, SUN)
        board.set_cell(1, 5, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_11_budget_8x8(self):
        board = TangoBoard(8)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, MOON)
        board.set_cell(0, 3, MOON)
        board.set_cell(0, 4, SUN)
        board.set_cell(0, 5, SUN)
        # Target: (0,6)=MOON, (0,7)=MOON
        board.set_cell(0, 6, MOON)
        board.set_cell(0, 7, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_12_budget_10x10(self):
        board = TangoBoard(10)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, MOON)
        board.set_cell(0, 3, MOON)
        board.set_cell(0, 4, SUN)
        board.set_cell(0, 5, SUN)
        board.set_cell(0, 6, MOON)
        board.set_cell(0, 7, SUN)
        # Target: (0,8)=MOON, (0,9)=MOON
        board.set_cell(0, 8, MOON)
        board.set_cell(0, 9, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_13_forbidden_chain(self):
        board = TangoBoard(4)
        board.set_cell(0, 0, SUN)
        board.set_h_edge(0, 0, EDGE_EQUAL)
        # Target: (0,1)=SUN, (0,2)=MOON
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_14_master_exam(self):
        board = TangoBoard(6)
        grid_step8 = [
            [0, 0, 1, 0, 2, 0],
            [0, 2, 0, 2, 0, 2],
            [2, 0, 0, 0, 0, 0],
            [0, 2, 0, 0, 0, 0],
            [0, 0, 2, 0, 1, 0],
            [0, 0, 2, 0, 2, 0]
        ]
        h_edges_step8 = [
            [2, 0, 1, 0, 0],
            [0, 0, 0, 2, 2],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 2, 0, 0, 0],
            [0, 2, 2, 0, 0]
        ]
        v_edges_step8 = [
            [0, 1, 1, 0, 2, 0],
            [2, 0, 2, 0, 0, 0],
            [0, 0, 0, 0, 2, 1],
            [0, 0, 0, 2, 2, 2],
            [2, 0, 1, 0, 0, 0]
        ]
        for r in range(6):
            for c in range(6):
                board.set_cell(r, c, grid_step8[r][c])
        for r in range(6):
            for c in range(5):
                board.set_h_edge(r, c, h_edges_step8[r][c])
        for r in range(5):
            for c in range(6):
                board.set_v_edge(r, c, v_edges_step8[r][c])
        
        sols = solve_tango(board)
        self.assertEqual(len(sols), 1)

if __name__ == '__main__':
    unittest.main()
