import unittest
from test_rules import TangoBoard, solve_tango, SUN, MOON, EMPTY, EDGE_NONE, EDGE_EQUAL, EDGE_OPPOSITE

class TestTutorialPatterns(unittest.TestCase):
    def test_step_1(self):
        board = TangoBoard(4)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(2, 2, MOON)
        board.set_cell(2, 3, MOON)
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
        # Target cells (0,4)=MOON, (0,5)=MOON
        board.set_cell(0, 4, MOON)
        board.set_cell(0, 5, MOON)
        self.assertTrue(board.is_valid_partial())
        self.assertEqual(len(board.check_three_in_a_row()), 0)
        self.assertEqual(len(board.check_balance()), 0)

    def test_step_3(self):
        board = TangoBoard(6)
        board.set_h_edge(0, 0, EDGE_OPPOSITE)
        board.set_h_edge(0, 2, EDGE_OPPOSITE)
        board.set_cell(0, 4, SUN)
        # Target: (0,5)=MOON
        board.set_cell(0, 5, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_4(self):
        board = TangoBoard(6)
        board.set_cell(0, 0, SUN)
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, MOON)
        board.set_cell(0, 3, MOON)
        # Target: (0,4)=SUN, (0,5)=MOON
        board.set_cell(0, 4, SUN)
        board.set_cell(0, 5, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_5(self):
        board = TangoBoard(6)
        board.grid[0] = [SUN, MOON, SUN, MOON, MOON, SUN]
        board.set_cell(1, 0, SUN)
        board.set_cell(1, 1, MOON)
        board.set_cell(1, 2, SUN)
        board.set_cell(1, 3, MOON)
        # Target: (1,4)=SUN, (1,5)=MOON -> row 1 becomes [SUN, MOON, SUN, MOON, SUN, MOON] != row 0
        board.set_cell(1, 4, SUN)
        board.set_cell(1, 5, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_6(self):
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
        self.assertEqual(len(board.check_three_in_a_row()), 0)
        self.assertEqual(len(board.check_balance()), 0)

    def test_step_7(self):
        board = TangoBoard(4)
        board.set_cell(0, 0, SUN)
        board.set_h_edge(0, 0, EDGE_EQUAL)
        # Target: (0,1)=SUN, (0,2)=MOON
        board.set_cell(0, 1, SUN)
        board.set_cell(0, 2, MOON)
        self.assertTrue(board.is_valid_partial())

    def test_step_8(self):
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
