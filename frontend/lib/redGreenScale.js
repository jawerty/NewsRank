const redGreenScale = (percentage, alpha) => {
	const A = (alpha) ? alpha : 1;
	const low = 100;
	const high = 225;
	const B = low;
	if (percentage == 100) {
	  return `rgba(${low},${high},${low},${A})`;
	}  else if (percentage == 0) {
	  return `rgba(${high},${low},${low},${A})`;
	};

	const denomination = (high-low)/100;
	const value = percentage*denomination;
	const offset = (100-percentage)*denomination;

	const R = low + offset
	const G = low + value;
	const rgbValue = `rgba(${parseInt(R)}, ${parseInt(G)}, ${parseInt(B)}, ${A})`;
	return rgbValue;
}

export { redGreenScale };