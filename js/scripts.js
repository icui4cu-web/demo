const CARDS_DATA = [
	{
		id: 0,
		type: "Five-SeveN",
		name: "Неистовый даймё",
		img: "1.png",
		rare: "mil-spec"
	}, {
		id: 1,
		type: "M249",
		name: "Призрак",
		img: "2.png",
		rare: "mil-spec"
	}
	, {
		id: 2,
		type: "P2000",
		name: "Искривление",
		img: "3.png",
		rare: "mil-spec"
	}, {
		id: 3,
		type: "SG 553",
		name: "Темнокрыл",
		img: "4.png",
		rare: "restricted"
	}, {
		id: 4,
		type: "CZ75-Auto",
		name: "Эко",
		img: "5.png",
		rare: "restricted"
	}, {
		id: 5,
		type: "M4A4",
		name: "Злобный дайме",
		img: "6.png",
		rare: "restricted"
	}, {
		id: 6,
		type: "AK-47",
		name: "Снежный вихрь",
		img: "7.png",
		rare: "classified"
	}, {
		id: 7,
		type: "M4A4",
		name: "Кибербезопасность",
		img: "8.png",
		rare: "classified"
	}, {
		id: 8,
		type: "M4A1-S",
		name: "Поток информации",
		img: "9.png",
		rare: "covert"
	}, {
		id: 9,
		type: "Glock-18",
		name: "Неонуар",
		img: "10.png",
		rare: "covert"
	}, {
		id: 10,
		type: "★ Тычковые ножи",
		name: "Кровавая паутина",
		img: "11.png",
		rare: "rare"
	}, {
		id: 11,
		type: "★ Скелетный нож",
		name: "Градиент",
		img: "12.png",
		rare: "rare"
	}
]


const Roulette = (function () {
	const ContainerUndefinedException		= "Контейнер не найден"
	const RotationIsAlreadyActiveException	= "Карусель уже активная"
	const PrizeNotFoundException			= "Приз не найден"

	const cssClasses = {
		ROTATING: 'roulette--rotating',
		CENTERING: 'roulette--centering',
		HIGHLIGHTING: 'roulette--highlight'
	}

	class Roulette {
		constructor(container, options) {
			let {
				minSlides = 30,
				slideWidth = 191,
				stopCallback = null,
                startCallback = null,
				rotatingTime = '10s',
				centeringTime = '1s'
            } = options || {};

			let node = 
				typeof container === "string" ? 
					document.querySelector(container) : 
				container instanceof HTMLElement ? 
					container : 
				container && container[0] instanceof HTMLElement ? 
					container[0] :
					undefined;

			if (!node) 
				throw ContainerUndefinedException

			let list = document.createElement("div");
			list.classList.add('roulette__list')
			node.appendChild(list)

			this.container = node
			this.list = list
			this.minSlides = minSlides
			this.rotatingTime = rotatingTime
			this.centeringTime = centeringTime
			this.slideWidth = slideWidth
			this.groupWidth = slideWidth * CARDS_DATA.length
			this.currentState = 'stop'
			
			this.prizeIndex = null
			this.distance = null
			this.slideShift = null
			this.groups = null

			this.animationFrame = 0;
			this.animationTimer = 0;

			if (startCallback)
                this.container.addEventListener('rotationStart', startCallback)
            if (stopCallback)
                this.container.addEventListener('rotationStop', stopCallback)

			this.list.addEventListener('transitionend', this.onTransitionEnd.bind(this))
		}

		start(prizeID, isSpin) {
			if (this.currentState === 'rotating' || this.currentState === 'centering')
                throw RotationIsAlreadyActiveException

			this.reset()

			let visibleGroups = Math.ceil(this.container.offsetWidth / this.groupWidth)


			let placeholderGroups = Math.ceil(this.minSlides / CARDS_DATA.length)

			// Определим каких групп больше, первых или вторых
			let groups = Math.max(visibleGroups, placeholderGroups)
			this.groups = groups
			let loops = groups + 1 + visibleGroups

			// победитель в следующей группе после groups

			this.updateList(prizeID, loops, groups)

			

			/*
				Сдвиг трека в начало
			*/
			const shiftToStart = this.list.offsetWidth / 2 - this.container.offsetWidth / 2

			// this.distance = groups * this.groupWidth + this.prizeIndex * this.slideWidth + shiftToStart

			/*
				Сдвиг трека до группы с победителем
			*/
			const shiftToWinnerGroup = -1 * groups * this.groupWidth + shiftToStart

			/*
				Сдвиг трека до слайда-победителя
			*/
			const shiftToWinnerSlide = shiftToWinnerGroup - this.prizeIndex * this.slideWidth

			const shiftToWinnerSlideViewportCentered = shiftToWinnerSlide + this.container.offsetWidth / 2

			// рандомный сдвиг в пределах слайда
			let slideShift = getRand(2, this.slideWidth - 2)

			// если свдиг выпал ровно на центр слайда - добавим еще 1px, иначе событие центрирования не завершится
			if(slideShift === this.slideWidth / 2) slideShift += 1
			this.slideShift = slideShift

			this.distance = shiftToWinnerSlideViewportCentered
			

			this.list.style.transform = `translateX(${shiftToStart}px)`
			this.runNextAnimationFrame(() => this.spin())
		}

		// вращение рулетки
		spin() {
			this.currentState = 'rotating'
			this.container.classList.add(cssClasses.ROTATING)
			this.container.dispatchEvent(new CustomEvent('rotationStart'));

			let translateX = this.distance - this.slideShift

			this.list.style.transitionDuration = this.rotatingTime + 's'
			this.list.style.transform = `translateX(${translateX}px)`
		}

		stop() {
			this.currentState = 'stop'
			this.container.dispatchEvent(new CustomEvent('rotationStop'));
		}

		// центрирование списка на победившей карточке
		centering() {
			this.currentState = 'centering'
			this.container.classList.add(cssClasses.CENTERING)

			let translateX = this.distance - this.slideWidth / 2
			let centeringTime = Math.abs(this.slideWidth / 2 - this.slideShift) * this.centeringTime / (this.slideWidth / 2)

			this.list.style.transitionDuration = centeringTime + 's'
			this.list.style.transform = `translateX(${translateX}px)`
		}

		// Подсветка победившей карточки
		highlight() {
			this.container.classList.add('roulette--highlight')
			this.list.children[this.groups].children[this.prizeIndex].classList.add('roulette__item--winner')

			this.stop()
		}

		updateList(prizeID, loops, groups) {
			let template = ''

			for(let i = 0; i < loops; i++) {
				shuffleArray(CARDS_DATA)

				template += '<div class="roulette__group">'
				template += CARDS_DATA.map(item => {
					return `
						<div class="roulette__item">
							<div class="box__skin light__${item.rare} bg__${item.rare}">
								<div class="box__item-img">
									<img src="img/${item.img}">
								</div>
								<span class="box__item-desc">
									<div class="box__desc-pos">
										<span class="box__skin-type d-inline-block">${item.type}</span>
										<span class="box__skin-name">${item.name}</span>
									</div>
								</span>
							</div>
						</div>
					`
				}).join('')
				template += '</div>'

				// если это группа элементов с победителем
				if(i === groups) {
					// получаем индекс победившей карточки в перетасованном массиве
					let prizeIndex = this.getPrizeIndex(CARDS_DATA, prizeID)
					if (prizeIndex === -1) throw PrizeNotFoundException
					this.prizeIndex = prizeIndex
				}
			}

			this.list.innerHTML = template
		}

		// поиск приза в массиве по ID
		getPrizeIndex(arr, prizeID) {
			return arr.findIndex(x => x.id === prizeID)
		}

		onTransitionEnd() {
			if(this.currentState === 'rotating') {
				this.container.classList.remove(cssClasses.ROTATING)
				this.centering()
				return
			}
			
			if(this.currentState === 'centering') {
				this.container.classList.remove(cssClasses.CENTERING)
				this.highlight()
				return
			}
		}

		reset() {
			this.list.innerHTML = ''
			this.list.style.transitionDuration = '0s'
			//this.list.style.transform = `none`
			this.container.classList.remove('roulette--highlight')
		}

		runNextAnimationFrame(callback) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = requestAnimationFrame(() => {
				this.animationFrame = 0;
				clearTimeout(this.animationTimer);
				this.animationTimer = setTimeout(callback, 0);
			});
		}
	}

	// перетасовка массива
	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	// Генерация рандомного числа от и до включительно
	function getRand(min, max) {
		min = Math.ceil(min)
		max = Math.ceil(max)

		return Math.floor(Math.random() * (max - min + 1)) + min
	}

	return Roulette
})()