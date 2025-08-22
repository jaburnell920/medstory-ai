# Task List

1. ✅ Analyze current tension-resolution page table generation and saving mechanism
Found that tableData is set via parseMarkdownTable when AI responses contain tables. Currently no automatic saving.
2. ✅ Modify tension-resolution page to automatically save Story Flow Table when generated
Added useEffect to automatically save tableData to localStorage with key 'storyFlowTable' when generated
3. ✅ Update create-map page to retrieve and display saved Story Flow Table
Added state for savedStoryFlowTable, retrieval logic in createStoryFlowMap, and renderSavedStoryFlowTable function to display the table in a blue box under the story flow map
4. 🔄 Test the complete flow from tension-resolution to create-map
Verify that the table is automatically saved and properly displayed in the create-map page

