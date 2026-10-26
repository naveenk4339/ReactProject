"""
test_poc.py - tests for the parts that do NOT need an API key.

The LLM's answers change from run to run, so we test the deterministic parts:
retrieval (does the right chunk come back?) and the agent's tools.
This is how you'd explain "evaluating a RAG system" in an interview:
check retrieval with known question -> expected source pairs.

Run:  python -m unittest test_poc.py -v
"""

import unittest
from types import SimpleNamespace
from unittest import mock

from rag import VectorStore, build_rag_prompt, cosine_similarity, embed
import step3_agent
from step3_agent import calculate_monthly_payment, get_car_price, run_agent, search_policies


class TestEmbeddings(unittest.TestCase):
    def test_stop_words_are_ignored_and_plurals_merged(self):
        vec = embed("The cars are returned")
        self.assertNotIn("the", vec)
        self.assertIn("car", vec)

    def test_cosine_similarity_bounds(self):
        a = embed("restocking fee")
        self.assertAlmostEqual(cosine_similarity(a, a), 1.0)
        self.assertEqual(cosine_similarity(a, embed("free delivery")), 0.0)


class TestRetrieval(unittest.TestCase):
    """A tiny retrieval eval: each question must find a chunk from the right file."""

    CASES = [
        ("What is the restocking fee for returns?", "return_policy.txt"),
        ("How long does delivery take?", "delivery.txt"),
        ("What interest rate do I get with a credit score of 750?", "financing.txt"),
        ("Does the warranty cover tires?", "warranty.txt"),
    ]

    @classmethod
    def setUpClass(cls):
        cls.store = VectorStore()

    def test_top_result_comes_from_expected_document(self):
        for question, expected_source in self.CASES:
            with self.subTest(question=question):
                results = self.store.search(question, top_k=3)
                self.assertTrue(results, "no chunks retrieved")
                self.assertEqual(results[0]["source"], expected_source)

    def test_unrelated_question_retrieves_nothing(self):
        self.assertEqual(self.store.search("quantum banana"), [])

    def test_prompt_contains_context_and_question(self):
        results = self.store.search("restocking fee")
        prompt = build_rag_prompt("restocking fee?", results)
        self.assertIn("2 percent", prompt)
        self.assertIn("Question: restocking fee?", prompt)


class TestAgentTools(unittest.TestCase):
    def test_get_car_price_is_case_insensitive(self):
        self.assertEqual(get_car_price("model 3")["price_usd"], 42000)

    def test_get_car_price_unknown_model(self):
        self.assertIn("error", get_car_price("Batmobile"))

    def test_monthly_payment_matches_loan_formula(self):
        # 42000 car - 10% down = 37800 loan, 6.5% for 60 months
        self.assertEqual(calculate_monthly_payment(37800, 6.5, 60)["monthly_payment_usd"], 739.6)

    def test_monthly_payment_zero_interest(self):
        self.assertEqual(calculate_monthly_payment(12000, 0, 12)["monthly_payment_usd"], 1000.0)

    def test_monthly_payment_rejects_bad_inputs(self):
        # Inputs come from the LLM, so nonsense must return an error, not crash or give a negative payment
        for args in [(37800, 6.5, 0), (37800, 6.5, -12), (37800, 6.5, 1.5), (0, 6.5, 60), (-5000, 6.5, 60), (37800, -1, 60)]:
            with self.subTest(args=args):
                self.assertIn("error", calculate_monthly_payment(*args))

    def test_search_policies_tool_uses_rag(self):
        self.assertEqual(search_policies("interest rate")[0]["source"], "financing.txt")


class TestChatMemory(unittest.TestCase):
    """Memory = resending the whole conversation. We swap in a fake LLM so no API key is needed."""

    def test_chat_memory_keeps_history(self):
        sent = []  # how many messages the "LLM" received on each call

        def fake_llm(messages, system=None, tools=None):
            sent.append(len(messages))
            reply = SimpleNamespace(type="text", text="ok")
            return SimpleNamespace(stop_reason="end_turn", content=[reply])

        history = []
        with mock.patch.object(step3_agent, "call_claude", fake_llm):
            run_agent("Price of a Civic?", messages=history)
            run_agent("What about 72 months?", messages=history)

        self.assertEqual(sent, [1, 3])  # 2nd call also sees the 1st question and answer
        self.assertEqual(history[0]["content"], "Price of a Civic?")
        self.assertEqual(len(history), 4)  # user, assistant, user, assistant


if __name__ == "__main__":
    unittest.main()
