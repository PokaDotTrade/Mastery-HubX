
const GIST_FILENAME = 'mastery_hub_data.json';
const GIST_DESCRIPTION = 'Mastery Hub Data (Encrypted Local Protocol)';

export async function syncToGitHub(token: string, data: any) {
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Find existing Gist
    const gistsResponse = await fetch('https://api.github.com/gists', { headers });
    if (!gistsResponse.ok) throw new Error('Failed to fetch gists');
    
    const gists = await gistsResponse.json();
    const existingGist = gists.find((g: any) => g.description === GIST_DESCRIPTION || g.files[GIST_FILENAME]);

    const body = JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2)
        }
      }
    });

    let response;
    if (existingGist) {
      // 2. Update existing
      response = await fetch(`https://api.github.com/gists/${existingGist.id}`, {
        method: 'PATCH',
        headers,
        body
      });
    } else {
      // 3. Create new
      response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers,
        body
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to sync to GitHub');
    }

    return await response.json();
  } catch (error) {
    console.error('GitHub Sync Error:', error);
    throw error;
  }
}

export async function restoreFromGitHub(token: string) {
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
  };

  try {
    const gistsResponse = await fetch('https://api.github.com/gists', { headers });
    if (!gistsResponse.ok) throw new Error('Failed to fetch gists');
    
    const gists = await gistsResponse.json();
    const existingGist = gists.find((g: any) => g.description === GIST_DESCRIPTION || g.files[GIST_FILENAME]);

    if (!existingGist) throw new Error('No cloud backup found on this account.');

    const gistDetailResponse = await fetch(existingGist.url, { headers });
    const gistDetail = await gistDetailResponse.json();
    const fileContent = gistDetail.files[GIST_FILENAME].content;

    return JSON.parse(fileContent);
  } catch (error) {
    console.error('GitHub Restore Error:', error);
    throw error;
  }
}
