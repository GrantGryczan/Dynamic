"use strict";
let playing = false;
let then;
const animate = now => {
	requestAnimationFrame(animate);
	if(playing) {
		const elapsed = now - then;
		const interval = 1000 / project.data.fps;
		const change = project.data.fps === 0 ? 1 : Math.floor(elapsed / interval);
		if(change > 0) {
			then = now - elapsed % interval;
			let value = project.time + change;
			for(const obj of project.root.objs) {
				if(obj.type === "audio") {
					for(let i = project.time + 1; i <= value; i++) {
						const keyframe = obj.keyframes[i];
						if(keyframe) {
							if(keyframe.present) {
								try {
									obj.media[keyframe.present.value ? "play" : "pause"]();
								} catch(err) {
									console.warn(err);
								}
							}
							if(keyframe.volume) {
								obj.media.volume = keyframe.volume.value;
							}
							if(keyframe.loop) {
								obj.media.loop = keyframe.loop.value;
							}
							if(keyframe.speed) {
								obj.media.playbackRate = keyframe.speed.value;
							}
							if(keyframe.time) {
								obj.media.currentTime = keyframe.time.value + obj.media.playbackRate * elapsed / 1000; // TODO: Make accurate
							}
						}
					}
				}
			}
			const lastFrame = project.root.duration - 1;
			const reachedEnd = (project.time === lastFrame || value >= lastFrame) && project.root === project.data.scenes[project.data.scenes.length - 1];
			if(reachedEnd && !project.loop) {
				pause();
				value = lastFrame;
			}
			setTime(value, true);
		}
	}
};
requestAnimationFrame(animate);
const play = () => {
	if(!playing) {
		const onLastScene = project.root === project.data.scenes[project.data.scenes.length - 1];
		if(project.time === project.root.duration - 1 && (onLastScene || !(project.root instanceof DynamicScene))) {
			if(onLastScene && project.data.scenes.length !== 1) {
				setRoot(project.data.scenes[0]);
			}
			setTime(0, true);
		}
		then = performance.now();
		playing = true;
		foot.play.classList.add("hidden");
		foot.pause.classList.remove("hidden");
		updateLiveAudio();
	}
};
const pause = () => {
	if(playing) {
		playing = false;
		foot.pause.classList.add("hidden");
		foot.play.classList.remove("hidden");
		while(playingAudio.length) {
			playingAudio.pop().pause();
		}
	}
};
const playingAudio = [];
const updateLiveAudio = () => {
	for(const obj of project.root.objs) {
		if(obj.type === "audio") {
			if(!playingAudio.includes(obj.media)) {
				playingAudio.push(obj.media);
			}
			const computed = computeDynamicAudio(obj);
			try {
				obj.media[computed.play ? "play" : "pause"]();
			} catch(err) {
				console.warn(err);
			}
			obj.media.currentTime = computed.time;
			obj.media.volume = computed.volume;
			obj.media.loop = computed.loop;
			obj.media.playbackRate = computed.speed;
		}
	}
};
const updateOnionskin = () => {
	if(project.onionskin) {
		foot.enableOnionskin.classList.add("hidden");
		foot.disableOnionskin.classList.remove("hidden");
	} else {
		foot.disableOnionskin.classList.add("hidden");
		foot.enableOnionskin.classList.remove("hidden");
	}
};
