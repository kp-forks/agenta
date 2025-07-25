export enum EvaluationFlow {
    EVALUATION_INITIALIZED = "EVALUATION_INITIALIZED",
    EVALUATION_STARTED = "EVALUATION_STARTED",
    COMPARISON_RUN_STARTED = "COMPARISON_RUN_STARTED",
    EVALUATION_FINISHED = "EVALUATION_FINISHED",
    EVALUATION_FAILED = "EVALUATION_FAILED",
}

export enum EvaluationType {
    human = "human",
    human_a_b_testing = "human_a_b_testing",
    human_scoring = "human_scoring",
    auto_exact_match = "auto_exact_match",
    auto_similarity_match = "auto_similarity_match",
    auto_ai_critique = "auto_ai_critique",
    custom_code_run = "custom_code_run",
    auto_regex_test = "auto_regex_test",
    auto_webhook_test = "auto_webhook_test",
    single_model_test = "single_model_test",
    field_match_test = "field_match_test",
    rag_faithfulness = "rag_faithfulness",
    rag_context_relevancy = "rag_context_relevancy",
    auto_json_diff = "auto_json_diff",
    auto_semantic_similarity = "auto_semantic_similarity",
}
