<template>
	<div class="ttt">
		<div class="card" data-state="#about">
			<div class="card-header">
				<div
					class="card-cover"
					style="
						background-image: url('https://images.unsplash.com/photo-1549068106-b024baf5062d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=934&q=80');
					"
				></div>
				<img
					class="card-avatar"
					src="https://images.unsplash.com/photo-1549068106-b024baf5062d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=934&q=80"
					alt="avatar"
				/>
				<h1 class="card-fullname">William Rocheald</h1>
				<h2 class="card-jobtitle">UI Developer</h2>
			</div>
			<div class="card-main">
				<div class="card-section is-active" id="about">
					<div class="card-content">
						<div class="card-subtitle">ABOUT</div>
						<p class="card-desc">
							Whatever tattooed stumptown art party sriracha gentrify hashtag intelligentsia readymade schlitz brooklyn disrupt.
						</p>
					</div>
				</div>
				<div class="card-section" id="contact">
					<div class="card-content">
						<div class="card-subtitle">CONTACT</div>
						<div class="card-contact-wrapper">
							<div class="card-contact">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
								<span>Algonquin Rd, Three Oaks Vintage, MI, 49128</span>
							</div>
							<div class="card-contact">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewbox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path
										d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
									/>
								</svg>
								<span>(269) 756-9809</span>
							</div>
							<div class="card-contact">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
									<path d="M22 6l-10 7L2 6" />
								</svg>
								<span>william@rocheald.com</span>
							</div>
							<button class="contact-me">WORK TOGETHER</button>
						</div>
					</div>
				</div>
				<div class="card-buttons">
					<button data-section="#about" class="is-active" @click="handleButtonClick('about')">ABOUT</button>
					<button data-section="#contact" @click="handleButtonClick('contact')">CONTACT</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
let buttons: any = null;
let sections: any = null;
let card: any = null;

const handleButtonClick = (section: string) => {
	buttons = document.querySelectorAll(".card-buttons button");
	sections = document.querySelectorAll(".card-section");
	card = document.querySelector(".card");
	const targetSection: any = `#${section}`;
	const sectionDom: any = document.querySelector(targetSection);
	section !== "about" ? card.classList.add("is-active") : card.classList.remove("is-active");
	card.setAttribute("data-state", targetSection);
	sections.forEach((s: any) => s.classList.remove("is-active"));
	buttons.forEach((b: any) => b.classList.remove("is-active"));
	sectionDom.classList.add("is-active");
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css?family=DM+Sans:400,500|Jost:400,500,600&display=swap");

* {
	box-sizing: border-box;
}

.card {
	max-width: 340px;
	margin: auto;
	overflow-y: auto;
	position: relative;
	z-index: 1;
	overflow-x: hidden;
	background-color: rgba(255, 255, 255, 1);
	display: flex;
	transition: 0.3s;
	flex-direction: column;
	border-radius: 10px;
	box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.2);
}

.card[data-state="#about"] {
	height: 450px;
	.card-main {
		padding-top: 0;
	}
}

.card[data-state="#contact"] {
	height: 450px;
}

.card.is-active {
	.card-header {
		height: 80px;
	}

	.card-cover {
		height: 100px;
		top: -50px;
	}

	.card-avatar {
		transform: none;
		left: 20px;
		width: 50px;
		height: 50px;
		bottom: 10px;
	}

	.card-fullname,
	.card-jobtitle {
		left: 86px;
		transform: none;
	}

	.card-fullname {
		bottom: 18px;
		font-size: 19px;
	}

	.card-jobtitle {
		bottom: 16px;
		letter-spacing: 1px;
		font-size: 10px;
	}
}

.card-header {
	position: relative;
	display: flex;
	height: 200px;
	flex-shrink: 0;
	width: 100%;
	transition: 0.3s;

	* {
		transition: 0.3s;
	}
}

.card-cover {
	width: 100%;
	height: 100%;
	position: absolute;
	height: 160px;
	top: -20%;
	left: 0;
	will-change: top;
	background-size: cover;
	background-position: center;
	filter: blur(30px);
	transform: scale(1.2);
	transition: 0.5s;
}

.card-avatar {
	width: 100px;
	height: 100px;
	box-shadow: 0 8px 8px rgba(0, 0, 0, 0.2);
	border-radius: 50%;
	object-position: center;
	object-fit: cover;
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%) translateY(-64px);
}

.card-fullname {
	position: absolute;
	bottom: 0;
	font-size: 22px;
	font-weight: 700;
	text-align: center;
	white-space: nowrap;
	transform: translateY(-10px) translateX(-50%);
	left: 50%;
}

.card-jobtitle {
	position: absolute;
	bottom: 0;
	font-size: 11px;
	white-space: nowrap;
	font-weight: 500;
	opacity: 0.7;
	text-transform: uppercase;
	letter-spacing: 1.5px;
	margin: 0;
	left: 50%;
	transform: translateX(-50%) translateY(-7px);
}

.card-main {
	position: relative;
	flex: 1;
	display: flex;
	padding-top: 10px;
	flex-direction: column;
}

.card-subtitle {
	font-weight: 700;
	font-size: 13px;
	margin-bottom: 8px;
}

.card-content {
	padding: 20px;
}

.card-desc {
	line-height: 1.6;
	color: #636b6f;
	font-size: 14px;
	margin: 0;
	font-weight: 400;
	font-family: "DM Sans", sans-serif;
}

.card-social {
	display: flex;
	align-items: center;
	padding: 0 20px;
	margin-bottom: 30px;
	svg {
		fill: rgb(165, 181, 206);
		width: 16px;
		display: block;
		transition: 0.3s;
	}
	a {
		color: #8797a1;
		height: 32px;
		width: 32px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: 0.3s;
		background-color: rgba(93, 133, 193, 0.05);
		border-radius: 50%;
		margin-right: 10px;

		&:hover {
			svg {
				fill: darken(rgb(165, 181, 206), 20%);
			}
		}

		&:last-child {
			margin-right: 0;
		}
	}
}

.card-buttons {
	display: flex;
	background-color: #fff;
	margin-top: auto;
	position: sticky;
	bottom: 0;
	left: 0;

	button {
		flex: 1 1 auto;
		user-select: none;
		background: 0;
		font-size: 13px;
		border: 0;
		padding: 15px 5px;
		cursor: pointer;
		color: #5c5c6d;
		transition: 0.3s;
		font-family: "Jost", sans-serif;
		font-weight: 500;
		outline: 0;
		border-bottom: 3px solid transparent;

		&.is-active,
		&:hover {
			color: #2b2c48;
			border-bottom: 3px solid #8a84ff;
			background: linear-gradient(
				to bottom,
				rgba(127, 199, 231, 0) 0%,
				rgba(207, 204, 255, 0.2) 44%,
				rgba(211, 226, 255, 0.4) 100%
			);
		}
	}
}

.card-section {
	display: none;
	&.is-active {
		display: block;
		animation: fadeIn 0.6s both;
	}
}

@keyframes fadeIn {
	0% {
		opacity: 0;
		transform: translatey(40px);
	}
	100% {
		opacity: 1;
	}
}

.card-timeline {
	margin-top: 30px;
	position: relative;
	&:after {
		background: linear-gradient(to top, rgba(134, 214, 243, 0) 0%, rgba(81, 106, 204, 1) 100%);
		content: "";
		left: 42px;
		width: 2px;
		top: 0;
		height: 100%;
		position: absolute;
		content: "";
	}
}

.card-item {
	position: relative;
	padding-left: 60px;
	padding-right: 20px;
	padding-bottom: 30px;
	z-index: 1;
	&:last-child {
		padding-bottom: 5px;
	}

	&:after {
		content: attr(data-year);
		width: 10px;
		position: absolute;
		top: 0;
		left: 37px;
		width: 8px;
		height: 8px;
		line-height: 0.6;
		border: 2px solid #fff;
		font-size: 11px;
		text-indent: -35px;
		border-radius: 50%;
		color: rgba(#868686, 0.7);
		background: linear-gradient(to bottom, lighten(#516acc, 20%) 0%, #516acc 100%);
	}
}

.card-item-title {
	font-weight: 500;
	font-size: 14px;
	margin-bottom: 5px;
}

.card-item-desc {
	font-size: 13px;
	color: #6f6f7b;
	line-height: 1.5;
	font-family: "DM Sans", sans-serif;
}

.card-contact-wrapper {
	margin-top: 20px;
}

.card-contact {
	display: flex;
	align-items: center;
	font-size: 13px;
	color: #6f6f7b;
	font-family: "DM Sans", sans-serif;
	line-height: 1.6;
	cursor: pointer;

	& + & {
		margin-top: 16px;
	}

	svg {
		flex-shrink: 0;
		width: 30px;
		min-height: 34px;
		margin-right: 12px;
		transition: 0.3s;
		padding-right: 12px;
		border-right: 1px solid #dfe2ec;
	}
}

.contact-me {
	border: 0;
	outline: none;
	background: linear-gradient(to right, rgba(83, 200, 239, 0.8) 0%, rgba(81, 106, 204, 0.8) 96%);
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
	color: #fff;
	padding: 12px 16px;
	width: 100%;
	border-radius: 5px;
	margin-top: 25px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	font-family: "Jost", sans-serif;
	transition: 0.3s;
}
</style>
