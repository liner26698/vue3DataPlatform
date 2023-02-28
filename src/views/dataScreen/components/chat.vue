<template>
	<!-- charGPT -->
	<div class="chat-box" v-show="chatGPT.show">
		<div class="chat">
			<div class="chat-title">
				<h1>
					<span>chatGPT-small</span>
					<span class="close" @click="close"
						><el-icon><CloseBold /></el-icon
					></span>
				</h1>
				<h2>{{ chatGPT.model }}</h2>
				<figure class="avatar">
					<img src="@/assets/images/chat_avatar.jpeg" />
				</figure>
			</div>
			<div class="messages">
				<div class="messages-content">
					<template v-for="(item, index) in messageList" :key="index">
						<div class="message new" v-if="index % 2 == 0">
							<figure class="avatar">
								<img src="@/assets/images/chat_avatar.jpeg" />
							</figure>
							{{ item.text }}
							<div class="ai-timestamp">{{ item.time }}</div>
						</div>
						<div class="message message-personal new" v-if="index % 2 != 0">
							{{ item.text }}
							<div class="user-timestamp">{{ item.time }}</div>
						</div>
					</template>

					<div class="message new loading" v-if="loading">
						<figure class="avatar">
							<img src="@/assets/images/chat_avatar.jpeg" />
						</figure>
						<span></span>
					</div>
				</div>
			</div>
			<div class="message-box" v-if="!loading">
				<textarea
					type="text"
					class="message-input"
					placeholder="一句话描述您的问题"
					ref="textArea"
					@keyup.enter="send()"
				></textarea>
				<button type="submit" class="message-submit" @click.enter="send()">发送</button>
			</div>
			<div class="message-box" v-else>
				<textarea type="text" class="message-input" disabled placeholder="正在搜索回答中...." ref="textArea"></textarea>
				<button type="submit" class="message-submit">({{ count }}s)</button>
			</div>
		</div>
		<div class="bg"></div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";
import { GlobalStore } from "@/store";

const globalStore = GlobalStore();
const { chatGPT } = globalStore;
const textArea: any = ref(null);
let loading = ref(false);
let messageList: any = ref([
	{
		time: "",
		text: "您好,请问有什么问题可以帮助您?"
	}
]);

// 发送等待-30秒倒计时
let timer: any = null;
let count = ref(30);
const countDown = () => {
	count.value = 30;
	timer = setInterval(() => {
		count.value--;
		if (count.value == 0) {
			clearInterval(timer);
			count.value = 30;
			loading.value = false;
		}
	}, 1000);
};

const send = async () => {
	let { value }: any = textArea.value;
	if (!value) return;
	textArea.value.value = "";
	pushMessage(value);
	let msg: any = await getMessage(value);
	pushMessage(msg);
	setTimeout(() => {
		textArea.value.focus();
	}, 100);
};

const getMessage = (text: string) => {
	let headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${chatGPT.keys}`
	};
	let params = {
		max_tokens: chatGPT.max_tokens,
		model: chatGPT.model,
		prompt: text,
		temperature: chatGPT.temperature
	};
	loading.value = true;
	countDown();

	return new Promise((resolve, reject) => {
		axios
			.post(`${chatGPT.urls}`, JSON.stringify(params), { headers })
			.then(res => {
				if (res?.data?.choices?.length) {
					resolve(res.data.choices[0].text);
				} else {
					reject("我不明白您的意思,请详细说明您的问题");
				}
			})
			.finally(() => {
				loading.value = false;
				clearInterval(timer);
				resolve("请求异常,请联系管理员~~");
			});
	});
};

const pushMessage = (text: string) => {
	let date = new Date();
	let time = date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());

	messageList.value.push({
		time,
		text
	});

	// 滚动条自动滚动到底部
	setTimeout(() => {
		let messageContent: any = document.querySelector(".messages-content");
		messageContent.scrollTop = messageContent.scrollHeight;
	}, 100);
};

const close = () => {
	globalStore.chatGPT.show = false;
};
</script>

<style lang="scss" scoped>
.chat-box {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	top: 0;
	margin: auto;
	width: 500px;
	height: 700px;
	z-index: 222222;
	transition: all 2s ease;
}
.chat {
	width: 100%;
	height: 100%;
}
@mixin center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

@mixin ball {
	@include center;
	content: "";
	display: block;
	width: 3px;
	height: 3px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.5);
	z-index: 2;
	margin-top: 4px;
	animation: ball 0.45s cubic-bezier(0, 0, 0.15, 1) alternate infinite;
}

/*--------------------
Body
--------------------*/
*,
*::before,
*::after {
	box-sizing: border-box;
}

html,
body {
	height: 100%;
}

body {
	background: linear-gradient(135deg, #044f48, #2a7561);
	background-size: cover;
	font-family: "Open Sans", sans-serif;
	font-size: 12px;
	line-height: 1.3;
	overflow: hidden;
}

.bg {
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	z-index: 1;
	background: url("https://images.unsplash.com/photo-1451186859696-371d9477be93?crop=entropy&fit=crop&fm=jpg&h=975&ixjsv=2.1.0&ixlib=rb-0.3.5&q=80&w=1925")
		no-repeat 0 0;
	filter: blur(80px);
	transform: scale(1.2);
}

/*--------------------
Chat
--------------------*/
.chat {
	@include center;
	width: 300px;
	height: 80vh;
	max-height: 500px;
	z-index: 2;
	overflow: hidden;
	box-shadow: 0 5px 30px rgba(0, 0, 0, 0.2);
	background: rgba(0, 0, 0, 0.5);
	border-radius: 20px;
	display: flex;
	justify-content: space-between;
	flex-direction: column;
}

/*--------------------
Chat Title
--------------------*/
.chat-title {
	flex: 0 1 45px;
	position: relative;
	z-index: 2;
	background: rgba(0, 0, 0, 0.2);
	color: #fff;
	text-transform: uppercase;
	text-align: left;
	padding: 10px 10px 10px 50px;

	h1,
	h2 {
		font-weight: normal;
		font-size: 10px;
		margin: 0;
		padding: 0;
	}

	h2 {
		color: rgba(255, 255, 255, 0.5);
		font-size: 8px;
		letter-spacing: 1px;
	}
	.close {
		font-size: 14px;
		float: right;
		cursor: pointer;
		transition: all 0.1s ease;

		&:hover {
			font-size: 16px;
			color: #1d7745;
			transition: all 0.1s ease;
		}
	}
	.avatar {
		position: absolute;
		z-index: 1;
		top: 8px;
		left: 9px;
		border-radius: 30px;
		width: 30px;
		height: 30px;
		overflow: hidden;
		margin: 0;
		padding: 0;
		border: 2px solid rgba(255, 255, 255, 0.24);

		img {
			width: 100%;
			height: auto;
		}
	}
}

/*--------------------
Messages
--------------------*/
.messages {
	flex: 1 1 auto;
	color: rgba(255, 255, 255, 0.5);
	overflow: hidden;
	position: relative;
	width: 100%;

	& .messages-content {
		position: absolute;
		top: 0;
		left: 0;
		height: 101%;
		width: 100%;
		overflow-y: scroll;
		overflow-x: hidden;
		// 滚动优化
		-webkit-overflow-scrolling: touch;
	}

	.message {
		clear: both;
		float: left;
		padding: 6px 10px 7px;
		border-radius: 10px 10px 10px 0;
		background: rgba(0, 0, 0, 0.3);
		margin: 8px 0;
		font-size: 11px;
		line-height: 1.4;
		margin-left: 35px;
		position: relative;
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);

		.ai-timestamp,
		.user-timestamp {
			position: absolute;
			bottom: -20px;
			font-size: 9px;
			color: rgba(255, 255, 255, 0.3);
		}

		&::before {
			content: "";
			position: absolute;
			bottom: -6px;
			border-top: 6px solid rgba(0, 0, 0, 0.3);
			left: 0;
			border-right: 7px solid transparent;
		}

		.avatar {
			position: absolute;
			z-index: 1;
			bottom: -15px;
			left: -35px;
			border-radius: 30px;
			width: 30px;
			height: 30px;
			overflow: hidden;
			margin: 0;
			padding: 0;
			border: 2px solid rgba(255, 255, 255, 0.24);

			img {
				width: 100%;
				height: auto;
			}
		}

		&.message-personal {
			float: right;
			color: #fff;
			text-align: right;
			background: linear-gradient(120deg, #248a52, #257287);
			border-radius: 10px 10px 0 10px;

			&::before {
				left: auto;
				right: 0;
				border-right: none;
				border-left: 5px solid transparent;
				border-top: 4px solid #257287;
				bottom: -4px;
			}
		}

		&:last-child {
			margin-bottom: 30px;
		}

		&.new {
			transform: scale(0);
			transform-origin: 0 0;
			animation: bounce 500ms linear both;
			margin-right: 3px;
			margin-top: 20px;
		}

		&.loading {
			&::before {
				@include ball;
				border: none;
				animation-delay: 0.15s;
			}

			& span {
				display: block;
				font-size: 0;
				width: 20px;
				height: 10px;
				position: relative;

				&::before {
					@include ball;
					margin-left: -7px;
				}

				&::after {
					@include ball;
					margin-left: 7px;
					animation-delay: 0.3s;
				}
			}
		}
	}
}
.ai-timestamp {
	left: 4px !important;
}
.user-timestamp {
	right: 2px !important;
}
/*--------------------
Message Box
--------------------*/
.message-box {
	flex: 0 1 40px;
	width: 100%;
	background: rgba(0, 0, 0, 0.3);
	padding: 10px;
	position: relative;

	& .message-input {
		background: none;
		border: none;
		outline: none !important;
		resize: none;
		color: rgba(255, 255, 255, 0.7);
		font-size: 11px;
		height: 17px;
		margin: 0;
		padding-right: 20px;
		width: 265px;
	}

	textarea:focus:-webkit-placeholder {
		color: transparent;
	}

	& .message-submit {
		position: absolute;
		z-index: 1;
		top: 9px;
		right: 10px;
		color: #fff;
		border: none;
		background: #248a52;
		font-size: 10px;
		text-transform: uppercase;
		line-height: 1;
		padding: 6px 10px;
		border-radius: 10px;
		outline: none !important;
		transition: background 0.2s ease;

		&:hover {
			background: #1d7745;
		}
	}
}

/*--------------------
Custom Srollbar
--------------------*/
.mCSB_scrollTools {
	margin: 1px -3px 1px 0;
	opacity: 0;
}

.mCSB_inside > .mCSB_container {
	margin-right: 0px;
	padding: 0 10px;
}

.mCSB_scrollTools .mCSB_dragger .mCSB_dragger_bar {
	background-color: rgba(0, 0, 0, 0.5) !important;
}

/*--------------------
Bounce
--------------------*/
@keyframes bounce {
	0% {
		transform: matrix3d(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	4.7% {
		transform: matrix3d(0.45, 0, 0, 0, 0, 0.45, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	9.41% {
		transform: matrix3d(0.883, 0, 0, 0, 0, 0.883, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	14.11% {
		transform: matrix3d(1.141, 0, 0, 0, 0, 1.141, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	18.72% {
		transform: matrix3d(1.212, 0, 0, 0, 0, 1.212, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	24.32% {
		transform: matrix3d(1.151, 0, 0, 0, 0, 1.151, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	29.93% {
		transform: matrix3d(1.048, 0, 0, 0, 0, 1.048, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	35.54% {
		transform: matrix3d(0.979, 0, 0, 0, 0, 0.979, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	41.04% {
		transform: matrix3d(0.961, 0, 0, 0, 0, 0.961, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	52.15% {
		transform: matrix3d(0.991, 0, 0, 0, 0, 0.991, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	63.26% {
		transform: matrix3d(1.007, 0, 0, 0, 0, 1.007, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	85.49% {
		transform: matrix3d(0.999, 0, 0, 0, 0, 0.999, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
	100% {
		transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}
}

@keyframes ball {
	from {
		transform: translateY(0) scaleY(0.8);
	}
	to {
		transform: translateY(-10px);
	}
}

/*--------------------
webkit-scrollbar
--------------------*/

.messages-content::-webkit-scrollbar {
	width: 2px;
	height: 2px;
	background-color: rgba(0, 0, 0, 0.5) !important;
}
.messages-content::-webkit-scrollbar-track {
	background: rgba(255, 255, 255, 0.5);
}
.messages-content::-webkit-scrollbar-thumb {
	background: rgba(0, 0, 0, 0.5) !important;
	border-radius: 50px;
}
.messages-content::-webkit-scrollbar-thumb:hover {
	background: rgba(0, 0, 0, 0.5) !important;
}
.messages-content::-webkit-scrollbar-corner {
	background: rgba(0, 0, 0, 0.5) !important;
}
</style>
