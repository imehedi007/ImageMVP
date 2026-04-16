import { ExperienceContent, RideFormData, RidePromptBundle } from "@/types";

export function buildRidePromptBundle(data: RideFormData, content: ExperienceContent): RidePromptBundle {
  const environment = content.environments.find((item) => item.id === data.environment);
  const mapped = content.behaviorQuestion.options.find((item) => item.id === data.behavior);
  const companionMode = content.settings.companionMode;
  const fallbackBehavior = content.behaviorQuestion.options[0];

  const selectedBehavior = mapped || fallbackBehavior;
  const personalityTraits = [data.vibe || "adventurous", ...selectedBehavior.traits];
  const sceneDirection = environment?.sceneDirection || "cinematic open-road atmosphere";
  const socialDynamic =
    companionMode === "solo"
      ? selectedBehavior.socialDynamicSolo
      : selectedBehavior.socialDynamicFriend;
  const subjectDirection =
    companionMode === "solo"
      ? `${data.name || "a stylish"} solo rider`
      : `${data.name || "a stylish"} rider with a close friend`;
  const compositionDirection =
    companionMode === "solo"
      ? "single subject only, no extra passenger, one rider on the bike"
      : "two friends together on the bike";
  const helmetDirection = content.settings.helmetRequired
    ? "The rider is wearing a premium full-face motorcycle helmet."
    : "The rider is not wearing a helmet. The face must be clearly visible and unobstructed.";
  const poseDirection = content.settings.poseDirection || "Stylish premium rider pose.";
  const cameraFrame = content.settings.cameraFrame || "Vertical premium portrait framing.";
  const wardrobeDirection =
    content.settings.wardrobeDirection ||
    "The rider is wearing fitted jeans, a real leather jacket, and premium biker streetwear.";
  const realismDirection =
    content.settings.realismDirection ||
    "Ultra photorealistic motorcycle campaign image with real materials and no cartoon styling.";
  const randomizedPose =
    content.settings.poseVariants.length > 0
      ? content.settings.poseVariants[Math.floor(Math.random() * content.settings.poseVariants.length)]
      : "";

  return {
    personalityTraits,
    emotionalTone: selectedBehavior.emotionalTone,
    socialDynamic,
    sceneDirection,
    imagePrompt:
      `Cinematic lifestyle scene of ${subjectDirection}, with ${socialDynamic}, ` +
      `featuring a real ${data.bikeType} Yamaha motorcycle in a ${data.environment} setting with ${sceneDirection}. ` +
      `${wardrobeDirection} Color accents use tones of ${data.favoriteColor}. Mood feels ${selectedBehavior.emotionalTone}. ${compositionDirection}. ` +
      `${helmetDirection} ${poseDirection} ${randomizedPose} ${cameraFrame} ` +
      `Preserve the exact identity of the uploaded person with maximum fidelity. The generated person must look like the same real individual from the reference photos. ` +
      `Match the face extremely closely: same face shape, jawline, forehead, eyebrows, eyes, nose, lips, ears, skin tone, hairline, hairstyle, facial proportions, and age appearance. ` +
      `Do not beautify, do not stylize, do not redesign the face, do not make the face more handsome, do not make the face more generic, and do not create a lookalike. ` +
      `Do not change ethnicity, do not change gender presentation, and do not change the natural facial character of the person. ` +
      `Prioritize identity preservation over cinematic styling. If there is any conflict between style and identity, preserve identity first. ` +
      `Face visibility is critical: keep the face unobstructed, sharp, front-readable, naturally lit, and clearly recognizable. ` +
      `Generate an ultra-realistic human portrait image. The face must be indistinguishable from a real DSLR or smartphone photo of a real person. ` +
      `Use natural human skin texture with visible pores, fine lines, subtle imperfections, realistic under-eye detail, natural lip texture, and true-to-life facial detail. ` +
      `Avoid smooth skin, waxy skin, plastic skin, airbrushed skin, beauty-retouched skin, CGI skin, or game-rendered skin. ` +
      `Maintain natural facial asymmetry. Do not make the face perfectly symmetrical. Keep real-life imperfection and believable human detail. ` +
      `The background must be a believable real-world environment, naturally photographed, with lighting and color tone that match the subject. ` +
      `Avoid artificial studio-looking compositing, fake CGI backgrounds, overly clean backdrops, or unrealistic environmental separation. ` +
      `Do not crop the top of the head. Do not crop the feet. Show the full body from head to toe. ` +
      `Camera must be pulled back enough to show visible ground below both shoes and comfortable space above the head. ` +
      `Avoid tight crop, avoid waist-up crop, avoid knee crop, avoid ankle crop. ` +
      `Do not place a helmet on the rider when helmet is disabled. Keep the face cleanly readable. No sunglasses, no face covering, no shadow hiding the eyes. ` +
      `No face alteration, no face drift, no generic model face, no beauty-filter skin, no anime, no illustration, no cartoon, no CGI look. ` +
      `${realismDirection} ` +
      `Natural lighting, premium composition, expressive body language, authentic human energy, ` +
      `brand-campaign-ready, marketing-friendly, social-media-ready, emotionally engaging, polished editorial realism.`,
    storyPrompt:
      `Create a concise JSON object with keys "summary" and "caption". The rider is ${data.name || "the user"}, ` +
      `with traits ${personalityTraits.join(", ")}. The emotional tone is ${selectedBehavior.emotionalTone}. ` +
      `The social dynamic is ${socialDynamic}. The scene is a ${data.environment} ride on a ${data.bikeType}. ` +
      `Favorite color: ${data.favoriteColor}. Keep the summary under 45 words and the caption under 18 words.`,
    summarySeed:
      `${data.name || "You"} ride like someone ${personalityTraits.join(", ")}, turning every ${data.environment} route into a shared memory.`,
    captionSeed: "Just found my ride personality. #RideStory #MyBikeMood"
  };
}

export function fallbackStoryText(data: RideFormData, bundle: RidePromptBundle) {
  return {
    summary:
      `${data.name || "You"} come across as ${bundle.personalityTraits.slice(0, 3).join(", ")}, with a ${bundle.emotionalTone} presence that makes every ${data.environment} ride feel cinematic and personal.`,
    caption: "Just found my ride personality. #RideStory #MyBikeMood"
  };
}
