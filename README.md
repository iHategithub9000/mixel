# mixel documentation

## commands
| Command | Description |
|---------|-------------|
| `#code <code>` | Runs code on the bot |
| `#quit` | Shut the bot down |
| `#quit1` | Shut the bot down with error code 1, restarting the bot if enabled in launcher's config |
| `#debug <flag> <bool>` | Sets debug flags |
| `#brainsurgery <operation> [args...]` | Conversation management |


## debug flags
| Flag | Description |
|-|-|
| `openrouter_json` | If `true`, the full OpenRouter JSON response will be logged to console. |
| `packet_log` | If `true`, all received Minecraft packets will be logged to console. |
| `raw_output` | If `true`, the bot will output the raw response from OpenRouter. |
| `unrestricted_code` | If `true`, the bot will execute code with unsafe keywords. |
| `can_sink` | If `true`, the bot can sink in water. |

## conf.json

### `mineflayer`
| Field     | Type             | Description                        |
|-----------|-----------------|------------------------------------|
| `owner`   | `string`         | Username of bot owner               |
| `username`| `string`         | Username of the bot                 |
| `ver`     | `string/bool`  | Version of target Minecraft server, `false` for auto |
| `host`    | `string`         | Address of target Minecraft server |
| `port`    | `integer`         | Port of target Minecraft server |
| `cmd_prefix`    | `string`         | Prefix for chat commands |

### `launcher`
| Field     | Type             | Description                        |
|-----------|-----------------|------------------------------------|
| `restart_on_kick_or_crash` | `bool` | If `true`, restarts the bot when it exits with non-0 exit code|
| `is_npm_a_cmd_file` | `bool` | If `true`, launches `npm` as a `.cmd` file. Else, launches it as an `.exe`.|
| `node` | `string` | Path to `Node.js` binary |
| `npm` | `string` | Path to `NPM` |
| `cmd` | `string` | Path to `CMD.EXE` binary |

### `openrouter`
| Field | Type | Description |
|-------|------|-------------|
| `msg_prefix` | `string` | User input has to start with this to be passed to the AI. The AI doesn't receive this. |
| `api_url` | `string` | URL of the API provider. Should be full url to the `completions` endpoint. |
| `provide_documentation` | `bool` | Whether to give the AI the full documentation to Mineflayer (stored in `mineflayer_docs.txt`) |
| `api_key` | `string` | API Key for the AI. |
| `model` | `string` | AI model slug. |
| `system_msg` | `string` | AI system message provided at the start of every conversation. This is the first thing ever said to the bot. |
| `max_tokens` | `integer` | This sets the upper limit for the number of tokens the model can generate in response. It won’t produce more than this limit. |
| `top_a` | `number` | Consider only the top tokens with “sufficiently high” probabilities based on the probability of the most likely token. Think of it like a dynamic Top-P. A lower Top-A value focuses the choices based on the highest probability token but with a narrower scope. A higher Top-A value does not necessarily affect the creativity of the output, but rather refines the filtering process based on the maximum probability. |
| `top_k` | `number` | This limits the model’s choice of tokens at each step, making it choose from a smaller set. A value of 1 means the model will always pick the most likely next token, leading to predictable results. By default this setting is disabled, making the model to consider all choices. |
| `top_p` | `number` | This setting limits the model’s choices to a percentage of likely tokens: only the top tokens whose probabilities add up to P. A lower value makes the model’s responses more predictable, while the default setting allows for a full range of token choices. Think of it like a dynamic Top-K. |
| `min_p` | `integer` | Represents the minimum probability for a token to be considered, relative to the probability of the most likely token. (The value changes depending on the confidence level of the most probable token.) If your Min-P is set to 0.1, that means it will only allow for tokens that are at least 1/10th as probable as the best possible option. |
| `presence_penalty` | `number` | Adjusts how often the model repeats specific tokens already used in the input. Higher values make such repetition less likely, while negative values do the opposite. Token penalty does not scale with the number of occurrences. Negative values will encourage token reuse. |
| `repetition_penalty` | `number` | Helps to reduce the repetition of tokens from the input. A higher value makes the model less likely to repeat tokens, but too high a value can make the output less coherent (often with run-on sentences that lack small words). Token penalty scales based on original token’s probability. |
| `frequency_penalty` | `number` | This setting aims to control the repetition of tokens based on how often they appear in the input. It tries to use less frequently those tokens that appear more in the input, proportional to how frequently they occur. Token penalty scales with the number of occurrences. Negative values will encourage token reuse. |
| `temperature` | `number` | This setting influences the variety in the model’s responses. Lower values lead to more predictable and typical responses, while higher values encourage more diverse and less common responses. At 0, the model always gives the same response for a given input. |
| `verbosity` | `string` | (Can be low, medium or high) Controls the verbosity and length of the model response. Lower values produce more concise responses, while higher values produce more detailed and comprehensive responses. |
| `referrer` | `string` | Site URL for rankings on openrouter.ai |
| `title` | `string` | Site title for rankings on openrouter.ai |
| `seed` | `integer/null` | If not null, the inferencing will sample deterministically, such that repeated requests with the same seed and parameters should return the same result. Determinism is not guaranteed for some models. |