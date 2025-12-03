const handleDeepResearch = async () => {
    if (!query.trim()) {
        setError('Please enter a query');
        return;
    }

    setIsDeepResearching(true);
    setError(null);
    setDeepResearchResult(null);
    setResearchProgress({ status: 'Starting deep research...', progress: 0 });

    try {
        const response = await fetch('/api/research/deep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error('Deep research failed');
        }

        const result = await response.json();
        setDeepResearchResult(result);
        setResearchProgress({ status: 'Complete!', progress: 100 });
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to perform deep research');
    } finally {
        setIsDeepResearching(false);
    }
};
